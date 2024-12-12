import htmlToMarkdown from '@wcj/html-to-markdown';

document.addEventListener('DOMContentLoaded', function() {
  const zipInput = document.getElementById('flomoZip');
  const usernameInput = document.getElementById('username');
  const convertBtn = document.getElementById('convertBtn');
  
  convertBtn.addEventListener('click', async function() {
    const file = zipInput.files[0];
    const username = usernameInput.value.trim();
    
    if (!username) {
      alert('Please enter your Blinko username');
      return;
    }
    
    if (!file) {
      alert('Please select Flomo export ZIP file');
      return;
    }

    try {
      // 创建输出的 ZIP 文件
      const outZip = new JSZip();

      // 读取输入的 ZIP 文件
      const zipData = await file.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(zipData);

      // 查找 HTML 文件和根目录名
      let htmlFile = null;
      let rootDir = '';
      for (const [path, entry] of Object.entries(zip.files)) {
        if (path.endsWith('.html') && !entry.dir) {
          htmlFile = entry;
          // 从 HTML 文件路径获取根目录名
          rootDir = path.split('/')[0];
          break;
        }
      }

      if (!htmlFile) {
        throw new Error('HTML file not found in ZIP');
      }

      // 读取 HTML 内容
      const htmlContent = await htmlFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // 获取所有笔
      const memos = doc.querySelectorAll('.memo');
      const notes = [];

      let noteId = 1;  // 用于生成递增的 ID
      let attachmentId = 1;  // 用于生成递增的附件 ID

      // 处理每条笔记
      for (const memo of memos) {
        try {
          const time = memo.querySelector('.time')?.textContent || '';
          const contentDiv = memo.querySelector('.content');
          const files = memo.querySelector('.files');
          
          // 先获取原始HTML内容
          const htmlContent = contentDiv?.innerHTML || '';
          
          // 使用 html-to-markdown 转换
          const markdown = await htmlToMarkdown({
            html: htmlContent,
            keepDataImages: false,
            ignoreTags: [],
            removeComments: true,
          });
          
          const noteData = {
            id: noteId++,
            account: {
              id: 1,
              name: username,
              nickname: username,
              password: '',
              image: '',
              apiToken: '',
              note: 0,
              role: 'user',
              createdAt: "2024-11-15T05:09:11.230Z",
              updatedAt: "2024-11-15T05:09:11.418Z"
            },
            content: `#flomo ${markdown}`,
            isArchived: false,
            isShare: false,
            isTop: false,
            createdAt: new Date(time).toISOString(),
            updatedAt: new Date(time).toISOString(),
            type: 0,
            attachments: [],
            references: [],
            referencedBy: []
          };

          // 处理图片
          if (files) {
            const images = files.querySelectorAll('img');
            if (images.length > 0) {
              for (const img of images) {
                try {
                  const src = img.getAttribute('src');
                  if (!src) continue;

                  // 从 src 中提取文件路径
                  const filePath = decodeURIComponent(src);
                  
                  // 在 ZIP 中查找图片，使用动态的根目录名
                  const imgFile = zip.files[`${rootDir}/${filePath}`];
                  if (imgFile && !imgFile.dir) {
                    const data = await imgFile.async('arraybuffer');
                    
                    // 获取原始文件名
                    const fileName = filePath.split('/').pop();
                    
                    // 生成 PNG 格式的文件名
                    const pngFileName = fileName.replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');

                    // 添加图片数据到 attachments
                    noteData.attachments.push({
                      id: attachmentId++,
                      isShare: false,
                      sharePassword: '',
                      name: pngFileName,  // 使用 PNG 格式的文件名
                      path: `/api/file/${pngFileName}`,  // 使用 PNG 格式的路径
                      size: String(imgFile._data.uncompressedSize),
                      type: 'image/png',  // 统一使用 PNG 类型
                      noteId: noteData.id,
                      createdAt: new Date(time).toISOString(),
                      updatedAt: new Date(time).toISOString()
                    });

                    // 将图片文件添加到 ZIP，直接放在 files 目录下
                    outZip.file(`files/${pngFileName}`, data);
                  }
                } catch (err) {
                  console.error('Failed to process image:', err);
                }
              }
            }
          }

          notes.push(noteData);
        } catch (err) {
          console.error('Failed to process memo:', err);
          continue;
        }
      }

      // 创建 bak.json
      const exportData = {
        notes: notes,
        exportTime: new Date().toISOString(),
        version: "0.22.1"
      };

      // 添加 bak.json 到 ZIP，直接在 pgdump 目录下，使用格式化的 JSON
      outZip.file('pgdump/bak.json', JSON.stringify(exportData, null, 2));

      // 生成 .bko 文件
      const bkoData = await outZip.generateAsync({
        type: 'blob'
      });
      
      // 下载文件
      const url = URL.createObjectURL(bkoData);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flomo_notes.bko';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });
});

function processHtmlContent(html) {
  try {
    // 移除多余的空格和换行
    html = html.trim();
    
    // 使用DOMParser解析HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 获取content内容
    const contentDiv = doc.querySelector('.content');
    if (!contentDiv) {
      return html;
    }
    
    // 获取纯文本内容
    let content = contentDiv.textContent || contentDiv.innerText;
    
    // 清理文本
    content = content.trim()
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/\n+/g, '\n'); // 合并多个换行
      
    return content;
  } catch (error) {
    console.error('Error processing HTML content:', error);
    return html;
  }
} 