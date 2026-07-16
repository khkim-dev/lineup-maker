import {toBlob} from 'html-to-image';

const showNotice=(message:string)=>{
  let notice=document.querySelector('.share-notice') as HTMLParagraphElement|null;
  if(!notice){
    notice=document.createElement('p');
    notice.className='notice share-notice';
    document.querySelector('.save')?.insertAdjacentElement('afterend',notice);
  }
  notice.textContent=message;
};

const showPreview=(url:string)=>{
  document.querySelector('.share-preview')?.remove();
  const layer=document.createElement('div');
  layer.className='share-preview';
  layer.setAttribute('role','dialog');
  layer.setAttribute('aria-modal','true');
  layer.innerHTML=`<div class="share-preview-card"><h2>캡처가 완성됐어요</h2><p>이미지를 길게 누른 뒤 이미지 공유를 선택하면 카카오톡으로 보낼 수 있어요.</p><img src="${url}" alt="완성된 스쿼드 캡처"><button class="share-preview-close" type="button">닫기</button></div>`;
  const close=()=>{URL.revokeObjectURL(url);layer.remove()};
  layer.querySelector('.share-preview-close')?.addEventListener('click',close);
  layer.addEventListener('click',e=>{if(e.target===layer)close()});
  document.body.append(layer);
};

document.addEventListener('click',async event=>{
  const button=(event.target as Element).closest('.save') as HTMLButtonElement|null;
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(button.disabled)return;
  const original=button.innerHTML;
  button.disabled=true;
  button.textContent='캡처 만드는 중…';
  showNotice('');
  try{
    const capture=document.querySelector('.capture') as HTMLElement|null;
    if(!capture)throw new Error('capture not found');
    const blob=await toBlob(capture,{pixelRatio:2,cacheBust:true,skipFonts:true});
    if(!blob)throw new Error('empty capture');
    const file=new File([blob],'우리팀-스쿼드.png',{type:'image/png'});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{
        await navigator.share({title:document.title,text:'우리 팀 선발 명단',files:[file]});
        showNotice('공유가 완료됐어요.');
        return;
      }catch(error){
        if((error as Error).name==='AbortError')return;
      }
    }
    if(navigator.clipboard?.write&&'ClipboardItem' in window){
      try{
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
        showNotice('이미지를 복사했어요. 카카오톡 대화방에서 붙여넣기 해주세요.');
        return;
      }catch{/* 이미지 미리보기 방식으로 계속 진행 */}
    }
    showPreview(URL.createObjectURL(blob));
    showNotice('이미지를 길게 눌러 카카오톡으로 공유해주세요.');
  }catch(error){
    console.error('capture failed',error);
    showNotice('캡처를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
  }finally{
    button.disabled=false;
    button.innerHTML=original;
  }
},true);
