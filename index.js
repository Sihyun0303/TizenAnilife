(function() {
    'use strict';

    let currentIndex = 0;
    let currentMode = "MAIN"; 

    // 1. 스타일 주입 (초록색 포커스 테두리 및 광고 제거)
    const style = document.createElement('style');
    style.textContent = `
        .remote-focus {
            outline: 6px solid #00FF00 !important;
            outline-offset: 2px;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.8);
            transform: scale(1.03);
            z-index: 9999 !important;
            position: relative;
            transition: all 0.1s ease-in-out;
            border-radius: 8px;
        }
        li.remote-focus { background-color: rgba(0, 255, 0, 0.15) !important; }
        div[aria-label*="Advertisement banner"] { display: none !important; }
    `;
    document.head.appendChild(style);

    // 2. 요소 탐색 및 이동 로직
    function getAllItems() {
        const sidebarItems = Array.from(document.querySelectorAll('nav li, aside li')).filter(li => li.querySelector('a'));
        const episodeItems = Array.from(document.querySelectorAll('li.group.cursor-pointer'));
        const contentLinks = Array.from(document.querySelectorAll('a.group.block, swiper-slide a'));
        return { sidebarItems, episodeItems, contentLinks };
    }

    function getNextIndex(items, direction) {
        if (!items.length) return -1;
        // 화면 너비에 따라 열 개수 계산 (TV 기준 보통 4열 또는 2열)
        const cols = (currentMode === "SIDEBAR") ? 1 : (window.innerWidth > 1200 ? 4 : 2);
        
        switch(direction) {
            case 'L': return (currentIndex % cols !== 0) ? currentIndex - 1 : -1;
            case 'R': return (currentIndex % cols < cols - 1 && currentIndex + 1 < items.length) ? currentIndex + 1 : -1;
            case 'U': return (currentIndex - cols >= 0) ? currentIndex - cols : -1;
            case 'D': return (currentIndex + cols < items.length) ? currentIndex + cols : -1;
            default: return -1;
        }
    }

    function applyFocus(items) {
        if (!items || items.length === 0) return;
        document.querySelectorAll('.remote-focus').forEach(el => el.classList.remove('remote-focus'));
        if (currentIndex >= items.length) currentIndex = 0;
        const target = items[currentIndex];
        if (target) {
            target.classList.add('remote-focus');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // 3. 비디오 제어 (리모컨 미디어 키용)
    function controlVideo(action) {
        const video = document.querySelector('video');
        if (!video) return;
        switch(action) {
            case 'PlayPause': if (video.paused) video.play(); else video.pause(); break;
            case 'Forward': video.currentTime += 10; break;
            case 'Rewind': video.currentTime -= 10; break;
        }
    }

    // 4. 리모컨 키 이벤트 리스너 (Tizen 키코드 대응)
    window.addEventListener('keydown', (e) => {
        const { sidebarItems, episodeItems, contentLinks } = getAllItems();
        let activeItems = (currentMode === "SIDEBAR") ? sidebarItems : (episodeItems.length > 0 ? episodeItems : contentLinks);

        switch(e.keyCode) {
            case 37: // Left (좌)
                const nextL = getNextIndex(activeItems, 'L');
                if (nextL === -1 && currentMode === "MAIN") {
                    currentMode = "SIDEBAR"; currentIndex = 0; applyFocus(sidebarItems);
                } else if (nextL !== -1) {
                    currentIndex = nextL; applyFocus(activeItems);
                }
                break;
            case 38: // Up (상)
                const nextU = getNextIndex(activeItems, 'U');
                if (nextU !== -1) { currentIndex = nextU; applyFocus(activeItems); }
                break;
            case 39: // Right (우)
                const nextR = getNextIndex(activeItems, 'R');
                if (nextR !== -1) { currentIndex = nextR; applyFocus(activeItems); }
                break;
            case 40: // Down (하)
                const nextD = getNextIndex(activeItems, 'D');
                if (nextD !== -1) { currentIndex = nextD; applyFocus(activeItems); }
                break;
            case 13: // Enter (확인)
                const target = activeItems[currentIndex];
                if (target) {
                    const link = target.tagName === 'A' ? target : target.querySelector('a');
                    if (link) link.click(); else target.click();
                }
                break;
            case 10009: // Back (이전/복귀)
                if (currentMode === "SIDEBAR") {
                    currentMode = "MAIN"; currentIndex = 0;
                    applyFocus(episodeItems.length > 0 ? episodeItems : contentLinks);
                    e.preventDefault();
                } else { 
                    window.history.back(); 
                    e.preventDefault(); 
                }
                break;
            // 미디어 키 처리
            case 10252: controlVideo('PlayPause'); break; // MediaPlayPause
            case 415: controlVideo('PlayPause'); break;   // MediaPlay
            case 19: controlVideo('PlayPause'); break;    // MediaPause
        }
    });

    console.log("Anilife TV Mod Loaded - TizenAnilife");
})();
