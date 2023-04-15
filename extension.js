const vscode = require('vscode');

// Constants for ERB and HTML comments
const ERB_COMMENT = '<%#';
const HTML_COMMENT_START = '<!--';
const HTML_COMMENT_END = '-->';

const { toggleErbComment } = require('./erbCommenter');
const { toggleHtmlComment } = require('./htmlCommenter');


// Toggles the comment based on the type of comment (ERB or HTML)
function toggleComment(code) {
  const trimmedCode = code.trim()
  switch(true) {
    case trimmedCode.startsWith('<%'):
      return toggleErbComment(code);
    case trimmedCode.startsWith('<!--'):
      return toggleHtmlComment(code);
    default:
      return HTML_COMMENT_START + code.replace('<%', ERB_COMMENT) + HTML_COMMENT_END;
  }
}

/**
 * @param {{ subscriptions: vscode.Disposable[]; }} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('extension.erbCommenter', function () {
    let editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "erb") {
      return;
    }
    let doc = editor.document;
    editor.edit(editBuilder => {
      let selections = editor.selections;
      selections.forEach(selection => {
        if (selection.isEmpty) {
          const { start } = selection;
          const startLine = doc.lineAt(start.line);
          const startChar = startLine.firstNonWhitespaceCharacterIndex;
          const endChar = startLine.text.length;
          selection = new vscode.Selection(start.line, startChar, start.line, endChar);
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
                  commentedLines.push(slicedLines[index].replace("<%", ERB_COMMENT))
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
                  commentedLines.push(slicedLines[index].replace("<%", ERB_COMMENT) + "-->")
                  count = index
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
      })
    });
  });
  context.subscriptions.push(disposable);
}

exports.activate = activate;
