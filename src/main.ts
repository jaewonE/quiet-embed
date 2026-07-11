import { MarkdownPostProcessorContext, Plugin } from 'obsidian';

const EMBED_SELECTOR = '.internal-embed.markdown-embed, .markdown-embed';
const EMBED_CONTENT_SELECTOR = '.markdown-embed-content';
const EMBED_TITLE_SELECTOR = '.markdown-embed-title, .file-embed-title';
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';
const HIDDEN_HEADING_CONTAINER_CLASS = 'quiet-embed-hidden-heading-container';
const HIDDEN_HEADING_CLASS = 'quiet-embed-hidden-heading';
const PROCESSED_ATTRIBUTE = 'data-quiet-embed-processed';
const SOURCE_PATH_ATTRIBUTE = 'data-quiet-embed-source-path';

export default class QuietEmbedPlugin extends Plugin {
	private observer: MutationObserver | null = null;

	onload(): void {
		this.registerMarkdownPostProcessor((element, context) => {
			this.processEmbeds(element, context);
		}, 1000);

		this.processEmbeds(activeDocument.body);
		this.observeRenderedEmbeds();

		this.registerDomEvent(activeDocument, 'click', this.handleModifiedClick, true);
	}

	onunload(): void {
		this.observer?.disconnect();
		this.observer = null;
	}

	private observeRenderedEmbeds(): void {
		this.observer = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					for (const node of Array.from(mutation.addedNodes)) {
						if (isHTMLElement(node)) {
							this.processEmbeds(node);
						}
					}
				}
		});

		this.observer.observe(activeDocument.body, {
			childList: true,
			subtree: true,
		});

		this.register(() => this.observer?.disconnect());
	}

	private processEmbeds(
		root: HTMLElement,
		context?: MarkdownPostProcessorContext,
	): void {
		const embeds = this.collectEmbeds(root);
		for (const embed of embeds) {
			if (context?.sourcePath) {
				embed.setAttribute(SOURCE_PATH_ATTRIBUTE, context.sourcePath);
			}

			if (embed.getAttribute(PROCESSED_ATTRIBUTE) !== 'true') {
				embed.setAttribute(PROCESSED_ATTRIBUTE, 'true');
				embed.addClass('quiet-embed');
				embed.setAttribute('tabindex', '0');
			}

			this.hideEmbedChrome(embed);
			this.hideFirstEmbeddedHeading(embed);
		}
	}

	private collectEmbeds(root: HTMLElement): HTMLElement[] {
		const embeds = Array.from(root.querySelectorAll<HTMLElement>(EMBED_SELECTOR));
		if (root.matches(EMBED_SELECTOR)) {
			embeds.unshift(root);
		}
		const ancestorEmbed = root.closest<HTMLElement>(EMBED_SELECTOR);
		if (ancestorEmbed && !embeds.includes(ancestorEmbed)) {
			embeds.unshift(ancestorEmbed);
		}
		return embeds;
	}

	private hideEmbedChrome(embed: HTMLElement): void {
		for (const title of Array.from(embed.querySelectorAll<HTMLElement>(EMBED_TITLE_SELECTOR))) {
			if (title.closest(EMBED_SELECTOR) === embed) {
				title.addClass('quiet-embed-hidden-title');
			}
		}
	}

	private hideFirstEmbeddedHeading(embed: HTMLElement): void {
		const content = embed.querySelector<HTMLElement>(EMBED_CONTENT_SELECTOR) ?? embed;
		const headings = Array.from(content.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
		const firstOwnHeading = headings.find((heading) => heading.closest(EMBED_SELECTOR) === embed);
		if (!firstOwnHeading) {
			return;
		}

		firstOwnHeading.addClass(HIDDEN_HEADING_CLASS);

		const headingContainer = this.getHeadingContainer(firstOwnHeading, embed);
		headingContainer?.addClass(HIDDEN_HEADING_CONTAINER_CLASS);
	}

	private getHeadingContainer(heading: HTMLElement, embed: HTMLElement): HTMLElement | null {
		const parent = heading.parentElement;
		if (!parent || parent.closest(EMBED_SELECTOR) !== embed) {
			return null;
		}

		if (parent.matches('.el-h1, .el-h2, .el-h3, .el-h4, .el-h5, .el-h6, .markdown-heading')) {
			return parent;
		}

		return null;
	}

	private readonly handleModifiedClick = (event: MouseEvent): void => {
		if (!event.metaKey && !event.ctrlKey) {
			return;
		}
		this.openFromEvent(event);
	};

	private openFromEvent(event: MouseEvent): void {
		const embed = this.findEventEmbed(event.target);
		if (!embed) {
			return;
		}

		this.openEmbed(embed, event);
	}

	private findEventEmbed(target: EventTarget | null): HTMLElement | null {
		if (!isHTMLElement(target)) {
			return null;
		}

		return target.closest<HTMLElement>(EMBED_SELECTOR);
	}

	private openEmbed(embed: HTMLElement, event: Event): void {
		const linkText = this.getEmbedLinkText(embed);
		if (!linkText) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		const sourcePath =
			embed.getAttribute(SOURCE_PATH_ATTRIBUTE) ??
			this.getViewSourcePath(embed) ??
			this.app.workspace.getActiveFile()?.path ??
			'';

		this.app.workspace
			.openLinkText(linkText, sourcePath, false, { active: true })
			.catch((error: unknown) => {
				console.error('Quiet Embed failed to open embedded note.', error);
			});
	}

	private getEmbedLinkText(embed: HTMLElement): string | null {
		const directValue = this.getFirstAttribute(embed, [
			'src',
			'data-src',
			'data-href',
			'data-path',
			'href',
		]);
		if (directValue) {
			return normalizeLinkText(directValue);
		}

		const internalLink = embed.querySelector<HTMLElement>('a.internal-link, a[href], [data-href]');
		const nestedValue = internalLink
			? this.getFirstAttribute(internalLink, ['data-href', 'href', 'aria-label', 'title'])
			: null;
		return nestedValue ? normalizeLinkText(nestedValue) : null;
	}

	private getFirstAttribute(element: HTMLElement, names: string[]): string | null {
		for (const name of names) {
			const value = element.getAttribute(name);
			if (value && value.trim().length > 0) {
				return value;
			}
		}
		return null;
	}

	private getViewSourcePath(embed: HTMLElement): string | null {
		const view = embed.closest<HTMLElement>('.markdown-preview-view, .markdown-source-view');
		return view?.getAttribute('data-path') ?? null;
	}
}

function normalizeLinkText(value: string): string {
	let linkText = value.trim();

	if (linkText.startsWith('!')) {
		linkText = linkText.slice(1).trim();
	}
	if (linkText.startsWith('[[') && linkText.endsWith(']]')) {
		linkText = linkText.slice(2, -2).trim();
	}
	if (linkText.startsWith('#')) {
		return linkText;
	}
	if (linkText.startsWith('obsidian://')) {
		return decodeURIComponent(linkText.split('/').pop() ?? linkText);
	}

	return linkText;
}

function isHTMLElement(value: unknown): value is HTMLElement {
	return (
		typeof value === 'object' &&
		value !== null &&
		'instanceOf' in value &&
		(value as Node).instanceOf(HTMLElement)
	);
}
