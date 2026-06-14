const ROBOTS_META_PATTERN = /<meta name="robots" content="([^"]*)"\s*\/>/gi;
const NOINDEX_VALUE = "noindex";
const NOINDEX_NOFOLLOW_VALUE = "noindex, nofollow";

export function extractRobotsMetaContents(html) {
    return [...html.matchAll(ROBOTS_META_PATTERN)].map((match) => match[1]);
}

export function rewriteDuplicateRobotsMeta(html) {
    const values = extractRobotsMetaContents(html);
    if (!values.includes(NOINDEX_VALUE) || !values.includes(NOINDEX_NOFOLLOW_VALUE)) {
        return html;
    }

    return html.replace(/<meta name="robots" content="noindex"\s*\/>/g, "");
}

export function hasDuplicateRobotsMeta(html) {
    return extractRobotsMetaContents(html).length > 1;
}
