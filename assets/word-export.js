
window.RMSWordExport=(()=>{
  const esc=s=>String(s??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");

  function inline(s){
    let x=esc(s);
    x=x.replace(/`([^`]+)`/g,"<code>$1</code>");
    x=x.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
    x=x.replace(/__([^_]+)__/g,"<strong>$1</strong>");
    x=x.replace(/\*([^*]+)\*/g,"<em>$1</em>");
    x=x.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2">$1</a>');
    return x;
  }

  function markdownToHtml(md){
    const lines=String(md??"").replace(/\r\n?/g,"\n").split("\n");
    const out=[];
    let para=[], list=null;

    const flushPara=()=>{
      if(!para.length)return;
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para=[];
    };
    const closeList=()=>{
      if(list){out.push(`</${list}>`);list=null}
    };

    for(let i=0;i<lines.length;i++){
      const raw=lines[i], line=raw.trim();

      if(!line){
        flushPara();closeList();continue;
      }

      let m=line.match(/^(#{1,6})\s+(.+)$/);
      if(m){
        flushPara();closeList();
        const level=Math.min(6,m[1].length);
        out.push(`<h${level}>${inline(m[2])}</h${level}>`);
        continue;
      }

      if(/^(-{3,}|\*{3,}|_{3,})$/.test(line)){
        flushPara();closeList();out.push("<hr>");continue;
      }

      m=line.match(/^[-*+]\s+(.+)$/);
      if(m){
        flushPara();
        if(list!=="ul"){closeList();list="ul";out.push("<ul>")}
        out.push(`<li>${inline(m[1])}</li>`);
        continue;
      }

      m=line.match(/^\d+[.)]\s+(.+)$/);
      if(m){
        flushPara();
        if(list!=="ol"){closeList();list="ol";out.push("<ol>")}
        out.push(`<li>${inline(m[1])}</li>`);
        continue;
      }

      m=line.match(/^>\s?(.*)$/);
      if(m){
        flushPara();closeList();
        out.push(`<blockquote>${inline(m[1])}</blockquote>`);
        continue;
      }

      // Simple markdown table support.
      if(line.includes("|") && i+1<lines.length &&
         /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i+1])){
        flushPara();closeList();
        const rows=[];
        const split=row=>row.trim().replace(/^\||\|$/g,"").split("|").map(x=>x.trim());
        const headers=split(raw);
        i+=2;
        while(i<lines.length && lines[i].trim().includes("|") && lines[i].trim()){
          rows.push(split(lines[i])); i++;
        }
        i--;
        out.push("<table><thead><tr>"+headers.map(h=>`<th>${inline(h)}</th>`).join("")+"</tr></thead><tbody>");
        for(const row of rows)out.push("<tr>"+headers.map((_,j)=>`<td>${inline(row[j]??"")}</td>`).join("")+"</tr>");
        out.push("</tbody></table>");
        continue;
      }

      closeList();
      para.push(line);
    }

    flushPara();closeList();
    return out.join("\n");
  }

  function wordHtml(title,bodyHtml){
    const safeTitle=esc(title||"Research Document");
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Research Methods Studio">
<title>${safeTitle}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page{margin:1in}
body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#111}
h1{font-size:20pt;margin:0 0 14pt}
h2{font-size:15pt;margin:18pt 0 8pt}
h3{font-size:12.5pt;margin:14pt 0 6pt}
h4,h5,h6{font-size:11pt;margin:12pt 0 5pt}
p{margin:0 0 8pt}
ul,ol{margin:0 0 8pt 24pt}
li{margin:0 0 3pt}
blockquote{margin:8pt 24pt;padding-left:10pt;border-left:2pt solid #bbb;color:#444}
table{border-collapse:collapse;width:100%;margin:8pt 0}
th,td{border:1px solid #999;padding:5pt;vertical-align:top}
th{background:#eee;font-weight:bold}
code{font-family:Consolas,monospace;font-size:9.5pt}
hr{border:0;border-top:1px solid #aaa;margin:12pt 0}
a{color:#0563c1}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
  }

  function downloadDoc(filename,bodyHtml,title){
    const name=String(filename||"research-document.doc").replace(/\.(md|markdown)$/i,".doc");
    const html=wordHtml(title||name.replace(/\.doc$/i,""),bodyHtml);
    const blob=new Blob(["\ufeff",html],{type:"application/msword;charset=utf-8"});
    const a=document.createElement("a");
    const url=URL.createObjectURL(blob);
    a.href=url;
    a.download=name.endsWith(".doc")?name:`${name}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function fromMarkdown(filename,markdown,title){
    downloadDoc(filename,markdownToHtml(markdown),title);
  }

  return {markdownToHtml,wordHtml,downloadDoc,fromMarkdown};
})();
