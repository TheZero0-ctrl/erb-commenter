const ERB_COMMENT = '<%#';

// Toggles the ERB comment by replacing the ERB comment with <% and vice versa
function toggleErbComment(code) {
    if (code.trim().startsWith(ERB_COMMENT)) {
        return code.replace(ERB_COMMENT, '<%');
    } else {
        return code.replace('<%', ERB_COMMENT);
    }
}

module.exports = {
    toggleErbComment,
};