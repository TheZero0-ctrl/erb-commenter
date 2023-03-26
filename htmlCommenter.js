const ERB_COMMENT = '<%#';
const HTML_COMMENT_START = '<!--';
const HTML_COMMENT_END = '-->';

function toggleHtmlComment(code) {
    if (code.trim().startsWith(HTML_COMMENT_START) || code.trim().endsWith(HTML_COMMENT_END)) {
        return code.replace(HTML_COMMENT_START, '').replace(HTML_COMMENT_END, '').replace(ERB_COMMENT, '<%');
    } else {
        return HTML_COMMENT_START + code.replace('<%', ERB_COMMENT) + HTML_COMMENT_END;
    }
}

module.exports = {
    toggleHtmlComment,
};