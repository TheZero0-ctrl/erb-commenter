const vscode = require('vscode');

// Constants for ERB and HTML comments
const ERB_COMMENT = '<%#';
const HTML_COMMENT_START = '<!--';
const HTML_COMMENT_END = '-->';

// Toggles the ERB comment by replacing the ERB comment with <% and vice versa
function toggleErbComment(code) {
  if (code.trim().startsWith(ERB_COMMENT)) {
    return code.replace(ERB_COMMENT, '<%');
  } else {
    return code.replace('<%', ERB_COMMENT);
  }
}

// Toggles the HTML comment by replacing the start and end of the comment with an empty string and vice versa
function toggleHtmlComment(code) {
  if (code.trim().startsWith(HTML_COMMENT_START) || code.trim().endsWith(HTML_COMMENT_END)) {
    return code.replace(HTML_COMMENT_START, '').replace(HTML_COMMENT_END, '').replace(ERB_COMMENT, '<%');
  } else {
    return HTML_COMMENT_START + code.replace('<%', ERB_COMMENT) + HTML_COMMENT_END;
  }
}

// Toggles the comment based on the type of comment (ERB or HTML)
function toggleComment(code) {
  if (code.trim().startsWith('<%')) {
    return toggleErbComment(code);
  } else if (code.trim().startsWith('<!--')) {
    return toggleHtmlComment(code);
  } else {
    return HTML_COMMENT_START + code + HTML_COMMENT_END;
  }
}

/**
 * @param {{ subscriptions: vscode.Disposable[]; }} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('extension.erbCommenter', function () {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    let doc = editor.document;
    if (doc.languageId === "erb") {
      editor.edit(editBuilder => {
        let selections = editor.selections;
        for (let i = 0; i < selections.length; i++) {
          let selection = selections[i];
          if (selection.isEmpty) {
            let startLine = selection.start.line;
            let endLine = startLine;

            let startChar = doc.lineAt(startLine).firstNonWhitespaceCharacterIndex;

            let endChar = doc.lineAt(endLine).text.length

            selection = new vscode.Selection(startLine, startChar, endLine, endChar);
            if (startChar > endChar) {
              selection = new vscode.Selection(startLine, startChar, endLine, endChar);
            } else {
              selection = new vscode.Selection(startLine, startChar, startLine, endChar);
            }
          }
          let text = doc.getText(selection);
          let lines = text.split(/\r?\n/g);
          let commentedLines = []
          let slicedLines
          let count = 0
          for (let index = 0; index < lines.length; index++) {
            if (count >= 1) {
              count--
              continue
            }
            slicedLines = lines.slice(index) 
            let line = lines[index]
            if(line.trim().startsWith("<%") && !line.trim().includes("%>")) {
              commentedLines.push(toggleErbComment(line))
              for (let index = 1; index < slicedLines.length; index++) {
                if (slicedLines[index].trim().endsWith("%>")) {
                  commentedLines.push(slicedLines[index])
                  count = index
                  break
                } else {
                  commentedLines.push(slicedLines[index])
                }
                
              }
            } else if(line.trim().startsWith("<!--") && !line.trim().includes("-->")) {
              commentedLines.push(toggleHtmlComment(line))
              for (let index = 1; index < slicedLines.length; index++) {
                if (slicedLines[index].trim().endsWith("-->")) {
                  commentedLines.push(toggleHtmlComment(slicedLines[index].replace(ERB_COMMENT, "<%")))
                  count = index
                  break
                } else {
                  commentedLines.push(slicedLines[index].replace(ERB_COMMENT, "<%"))
                }
                
              }
            } else if(!line.trim().startsWith("<%") && !line.trim().startsWith("<%#") && !line.trim().startsWith("<!--") && slicedLines.length > 1) {
              for (let index = 1; index < slicedLines.length; index++) {
                if (!slicedLines[index].trim().startsWith("<%") && !slicedLines[index].trim().startsWith("<%#") && !slicedLines[index].trim().startsWith("<!--")){
                  if(index == slicedLines.length - 1 && index == 1){
                    commentedLines.push("<!--" + slicedLines[0].replace("<%", ERB_COMMENT))
                    commentedLines.push(slicedLines[1].replace("<%", ERB_COMMENT) + "-->")
                    count = index
                    break
                  } else if(index == 1) {
                    commentedLines.push("<!--" + slicedLines[0].replace("<%", ERB_COMMENT))
                    commentedLines.push(slicedLines[1].replace("<%", ERB_COMMENT))
                  } else {
                    if (index == slicedLines.length - 1) {
                      commentedLines.push(slicedLines[index].replace("<%", ERB_COMMENT) + "-->")
                      count = index
                      break
                    } else {
                      commentedLines.push(slicedLines[index].replace("<%", ERB_COMMENT))
                    }
                  }
                } else {
                  if (index == 1) {
                    commentedLines.push(toggleHtmlComment(slicedLines[0]))
                  } else {
                    commentedLines.push(slicedLines[index-1].replace("<%", ERB_COMMENT) + "-->")
                    count = index - 1
                  }
                  break
                }
                
              }

            }
            else {
              commentedLines.push(toggleComment(line))
            }
          }
          let commentedText = commentedLines.join("\n");
          editBuilder.replace(selection, commentedText);
        }
      });
    }
  });
  context.subscriptions.push(disposable);
}

exports.activate = activate;
