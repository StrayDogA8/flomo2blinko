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
          console.log('Original time:', time);
          console.log('Parsed time:', new Date(time).toISOString());
          
          const content = memo.querySelector('.content')?.innerHTML || '';
          const files = memo.querySelector('.files');
          
          // 去掉 HTML 标签
          const cleanContent = content
            // 先处理特殊字符
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            
            // 处理段落
            .replace(/<p[^>]*>\s*<\/p>/g, '\n')  // 处理空段落
            .replace(/<p[^>]*>/g, '')
            .replace(/<\/p>/g, '\n')
            
            // 处理列表
            .replace(/<ol[^>]*>/g, '\n')
            .replace(/<ul[^>]*>/g, '\n')
            .replace(/<li[^>]*>/g, (match, offset, string) => {
              const prevText = string.slice(0, offset);
              const olCount = (prevText.match(/<ol[^>]*>/g) || []).length;
              const ulCount = (prevText.match(/<ul[^>]*>/g) || []).length;
              const level = olCount + ulCount;
              const isOrdered = prevText.lastIndexOf('<ol') > prevText.lastIndexOf('<ul');
              const marker = isOrdered ? '1. ' : '- ';
              return '  '.repeat(Math.max(0, level - 1)) + marker;
            })
            .replace(/<\/li>/g, '\n')
            .replace(/<\/[ou]l>/g, '\n')
            
            // 处理格式化标签
            .replace(/<strong>\s*<\/strong>/g, '')  // 先移除空的strong标签
            .replace(/<strong>(.*?)<\/strong>/g, ' **$1** ')  // 在非空粗体标记两侧添加空格
            .replace(/<strong [^>]*>(.*?)<\/strong>/g, ' **$1** ')  // 带属性的粗体标签
            .replace(/<em>(.*?)<\/em>/g, '*$1*')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
            .replace(/<br\s*\/?>/g, '\n')
            
            // 移除其他HTML标签
            .replace(/<[^>]+>/g, '')
            
            // 清理空白字符
            .replace(/\n{3,}/g, '\n\n')     // 合并多个换行为最多两个
            .replace(/[ \t]+/g, ' ')        // 合并多个空格
            .replace(/\*\* +/g, '** ')      // 保持粗体标记后只有一个空格
            .replace(/ +\*\*/g, ' **')      // 保持粗体标记前只有一个空格
            .replace(/\n +/g, '\n')         // 移除每行开头的空格
            .replace(/[ \t]+\n/g, '\n')     // 移除每行结尾的空格
            .replace(/^\s+|\s+$/g, '');     // 移除开头和结尾的空白

          // 处理标签前的空格，但不处理行首的标签
          const formattedContent = cleanContent
            .replace(/([^\s\n])#/g, '$1 #');  // 只在非空格且非换行符的字符后面的#号前添加空格

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
            content: `#flomo ${formattedContent}`,
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