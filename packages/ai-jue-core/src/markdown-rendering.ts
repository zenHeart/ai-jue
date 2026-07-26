export function getAssetText(
    asset: any,
    preferredFields: string[] = ['content', 'prompt'],
): string {
    if (typeof asset === 'string') {
        return asset;
    }

    if (!asset || typeof asset !== 'object') {
        return '';
    }

    for (const field of preferredFields) {
        if (typeof asset[field] === 'string') {
            return asset[field];
        }
    }

    return '';
}

export function getRecordEntries<T = any>(value: Record<string, T> | null | undefined): Array<[string, T]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return [];
    }
    return Object.entries(value);
}

export function renderMarkdownWithFrontmatter(frontmatter: string, body: string): string {
    return `---\n${frontmatter.trim()}\n---\n\n${String(body).trim()}`;
}

export function renderBulletSection(title: string, intro: string, items: string[]): string {
    if (items.length === 0) return '';

    const lines = [`## ${title}`, ''];
    if (intro) {
        lines.push(intro, '');
    }
    lines.push(
        ...items.map((item) => {
            const trimmed = item.trim();
            return trimmed.startsWith('- ') ? trimmed : `- ${trimmed}`;
        }),
        '',
    );
    return `${lines.join('\n')}\n`;
}
