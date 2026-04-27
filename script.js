const app = document.getElementById('app');
const storyArea = document.getElementById('story-area');
const interactiveArea = document.getElementById('interactive-area');

let playerName = "Pockie";
let playerAvatar = "";
let state = {
    starTrekAttempts: 0
};

// Global audio element for the game
let bgAudio = new Audio();
bgAudio.loop = true;

let gameHistory = [];

function changeVibe(themeName, bgImage = null) {
    document.body.setAttribute('data-theme', themeName);
    if (bgImage) {
        // Overlay the image on top of the CSS radial-gradient, or use it as fallback
        document.body.style.backgroundImage = `url(${bgImage}), radial-gradient(circle at center, var(--bg-gradient-center) 0%, var(--bg-color) 100%)`;
        document.body.style.backgroundBlendMode = 'overlay';
    } else {
        document.body.style.backgroundImage = ''; // resets to css default
        document.body.style.backgroundBlendMode = 'normal';
    }
}

function clearStory() {
    storyArea.innerHTML = '';
    storyArea.classList.remove('fade-out');
}

function playSFX(src) {
    let sfx = new Audio(src);
    sfx.play().catch(e => console.log("SFX file missing", e));
    return sfx;
}

function typeWriter(text, element, speed = 20, callback = null) {
    let i = 0;
    element.innerHTML = '';

    function type() {
        if (i < text.length) {
            // Handle HTML tags inside typewriter by just skipping to the end of the tag
            if (text.charAt(i) === '<') {
                let tag = '';
                while (text.charAt(i) !== '>' && i < text.length) {
                    tag += text.charAt(i);
                    i++;
                }
                tag += '>';
                element.innerHTML += tag;
            } else {
                element.innerHTML += text.charAt(i);
            }
            i++;

            // Auto scroll to bottom
            storyArea.scrollTop = storyArea.scrollHeight;

            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type();
}

function addMessage(speaker, text, isHtml = false) {
    return new Promise((resolve) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';

        let speakerClass = 'speaker-interviewer';
        let speakerName = speaker;

        if (speaker === 'Player') {
            speakerClass = 'speaker-player';
            speakerName = playerName;
        } else if (speaker === 'System' || speaker === 'Narrator') {
            speakerName = ''; // No speaker header
        }

        if (speakerName) {
            const speakerHeader = document.createElement('div');
            speakerHeader.className = 'speaker-header';

            let avatarBase = null;
            if (speaker === 'Player' && playerAvatar) {
                avatarBase = playerAvatar.replace(/\.(png|jpg|jpeg)$/i, '');
            } else {
                // Dynamically use speaker name for image file
                // Special cases for specific speakers
                let imageName = speaker.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                // Map special speaker names to image files
                if (speaker === 'Tortoise') imageName = 'interviewertortoise';
                else if (speaker === 'Queen of Hearts') imageName = 'queenofhearts';
                else if (speaker === "Queen's Head") imageName = 'queenofhearts';
                
                avatarBase = `static/images/${imageName}`;
            }

            if (avatarBase) {
                const avatarImg = document.createElement('img');
                avatarImg.className = 'speaker-avatar';

                const exts = ['.png', '.jpg', '.jpeg'];
                let extIdx = 0;
                avatarImg.onerror = function () {
                    extIdx++;
                    if (extIdx < exts.length) {
                        this.src = avatarBase + exts[extIdx];
                    } else {
                        this.onerror = null;
                        this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="10" fill="none" stroke="%23d4af37" stroke-width="2"/%3E%3C/svg%3E';
                        this.style.border = 'none';
                    }
                };
                avatarImg.src = avatarBase + exts[0];

                speakerHeader.appendChild(avatarImg);
            }

            const speakerEl = document.createElement('div');
            speakerEl.className = speakerClass;
            speakerEl.textContent = speakerName;

            speakerHeader.appendChild(speakerEl);
            msgDiv.appendChild(speakerHeader);
        }

        const textEl = document.createElement('div');
        textEl.className = 'text-content';
        msgDiv.appendChild(textEl);

        storyArea.appendChild(msgDiv);

        if (isHtml) {
            textEl.innerHTML = text;
            storyArea.scrollTop = storyArea.scrollHeight;
            resolve();
        } else {
            typeWriter(text, textEl, 18, resolve); // Slower text speed
        }
    });
}

function clearInteractive() {
    interactiveArea.innerHTML = '';
}

function showChoices(choices) {
    clearInteractive();
    choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.id = `choice-btn-${index}`;
        btn.className = 'choice-btn';
        btn.innerHTML = choice.text;
        btn.onclick = () => {
            clearInteractive();
            storyArea.classList.add('fade-out');
            setTimeout(() => {
                if (choice.onClick) choice.onClick();
                else if (choice.nextScene) playScene(choice.nextScene);
            }, 2000);
        };
        interactiveArea.appendChild(btn);
    });
}

function showInput(placeholder, buttonText, onsubmit) {
    clearInteractive();

    const container = document.createElement('div');
    container.className = 'input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-field';
    input.placeholder = placeholder;

    const btn = document.createElement('button');
    btn.className = 'submit-btn';
    btn.textContent = buttonText;

    btn.onclick = () => {
        const val = input.value.trim();
        if (val) {
            clearInteractive();
            storyArea.classList.add('fade-out');
            setTimeout(() => onsubmit(val), 2000);
        }
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
    });

    container.appendChild(input);
    container.appendChild(btn);
    interactiveArea.appendChild(container);
    input.focus();
}

function showForm(placeholder, buttonText, onsubmit) {
    clearInteractive();

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';

    // Name input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'player-name-input';
    input.className = 'input-field form-margin';
    input.placeholder = placeholder;

    // Image selection
    const avatarGrid = document.createElement('div');
    avatarGrid.className = 'avatar-grid';

    let selectedAvatar = 'static/images/profile1.jpg';

    for (let i = 1; i <= 5; i++) {
        const imgBase = `static/images/profile${i}`;
        const imgWrapper = document.createElement('div');
        imgWrapper.className = `avatar-option ${i === 1 ? 'selected' : ''}`;

        const img = document.createElement('img');
        img.alt = `Profile ${i}`;

        const exts = ['.png', '.jpg', '.jpeg'];
        let extIdx = 0;
        img.onerror = function () {
            extIdx++;
            if (extIdx < exts.length) {
                this.src = imgBase + exts[extIdx];
            } else {
                this.onerror = null;
                this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"%3E%3Cpath fill="%23d4af37" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
                this.parentElement.style.border = 'none';
            }
        };
        img.src = imgBase + exts[0];

        imgWrapper.appendChild(img);

        imgWrapper.onclick = () => {
            document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            imgWrapper.classList.add('selected');
            selectedAvatar = imgBase + exts[0];
        };

        avatarGrid.appendChild(imgWrapper);
    }

    const btn = document.createElement('button');
    btn.id = 'submit-name-btn';
    btn.className = 'submit-btn';
    btn.textContent = buttonText;

    btn.onclick = () => {
        const val = input.value.trim();
        clearInteractive();
        onsubmit(val, selectedAvatar);
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
    });

    const formControls = document.createElement('div');
    formControls.style.display = 'flex';
    formControls.style.gap = '1rem';
    formControls.style.width = '100%';
    formControls.style.maxWidth = '600px';

    formControls.appendChild(input);
    formControls.appendChild(btn);

    formContainer.appendChild(avatarGrid);
    formContainer.appendChild(formControls);

    interactiveArea.appendChild(formContainer);
    input.focus();
}

const contractPages = [
    `<h3>THE AMELIA PROJECT - RELOCATION CONTRACT</h3>
    <p>Thank you for choosing to sign up for the Amelia Project. Please read through the contract and sign at the end.</p>
    <b>1. PARTIES</b><br>
    This Agreement is entered into between:<br>
    The Amelia Project (hereinafter "TAP", "we", "us", "a perfectly legitimate organization"), and<br>
    The undersigned individual (hereinafter "Client", "you", "the reason we're doing paperwork today").<br><br>
    <b>2. PURPOSE</b><br>
    2.1 The Client has requested relocation into a fictional setting.<br>
    2.2 TAP agrees to provide access to a constructed narrative environment ("Experience") inspired by one or more fictional universes.<br>
    2.3 For the avoidance of doubt, this is not:<br>
    - Time travel<br>
    - A chance to redo embarrassing moments (we checked, you have several)`,

    `<b>3. INTELLECTUAL PROPERTY</b><br>
    3.1 The Experience may include references to existing fictional works.<br>
    3.2 All rights to those works belong to their respective owners.<br>
    3.3 TAP:<br>
    - Does not own them<br>
    - Is not affiliated with them<br>
    - Is simply… Heavily inspired<br>
    3.4 The Client agrees not to object to:<br>
    - Characters behaving slightly off<br>
    - Plotlines not being related to canon<br>
    - Events making sense only in hindsight (if at all)<br>
    3.5 Complaints such as:<br>
    "That's not canon", "This violates lore", "He would never say that"<br>
    will be acknowledged politely and then ignored.`,

    `<b>4. NATURE OF EXPERIENCE</b><br>
    4.1 The Experience is interactive.<br>
    4.2 The Client may be offered choices.<br>
    4.3 You will not be experiencing any franchise for the first time. We do not have the same access to resources and funding as Men in Black and we cannot afford for the client to forget their dues.<br>
    4.4 These choices will:<br>
    - Sometimes matter<br>
    - Sometimes not matter<br>
    - Sometimes matter later in a way that feels mildly unfair<br>
    4.5 This is intentional.<br><br>
    <b>5. CLIENT RESPONSIBILITIES</b><br>
    5.1 The Client agrees to:<br>
    - Participate<br>
    - Engage<br>
    - Not just click randomly and then blame us<br>
    5.2 The Client further agrees to:<br>
    - The fact that eggplant was never meant to be consumed<br>
    - Praise our hot chocolate`,

    `<b>6. RISKS</b><br>
    6.1 Participation may result in:<br>
    - Emotional damage (manageable)<br>
    - Emotional growth (less manageable)<br>
    - Several existential crises<br>
    6.2 TAP is not liable for:<br>
    - Saying "oh." out loud and then staring into space<br><br>
    <b>7. LIMITATION OF CONTROL</b><br>
    7.1 The Client understands that:<br>
    - You cannot "win" everything<br>
    - You cannot "fix" everything<br>
    - You will still try<br>
    - If there are bugs in this, you will eat them and continue<br>
    7.2 TAP encourages this.`,

    `<b>8. CONFIDENTIALITY</b><br>
    8.1 Everything that happens is confidential.<br>
    8.2 Except:<br>
    You may tell friends, family, strangers, the Pentagon, the CIA, the NSA, the RAW, the Mossad, the FBI, MI6, James Bond, your lawyer, your doctor, your therapist, am I forgetting anyone else?<br><br>
    <b>9. STANDARD LEGAL-LOOKING SECTION</b><br>
    9.1 This clause exists to reassure you that this is a serious document.<br>
    9.2 Is it working?<br>
    9.3 You trust us now.<br>
    9.4 I wanted to add something else here but forgot.`,

    `<b>10. ADDITIONAL CLAUSES</b><br>
    10.1 This clause is important.<br>
    10.2 Happy birthday, <span id="contract-name"></span>!<br>
    10.3 This clause is also important.<br>
    10.4 We will not be explaining why.<br><br>
    <b>11. ACKNOWLEDGEMENT</b><br>
    11.1 If you are still reading:<br>
    - Impressive<br>
    - Slightly concerning<br>
    - Not required<br>
    11.2 Most clients stop by now.<br>
    11.3 We assume they signed anyway.`,

    `<b>12. EXIT POLICY</b><br>
    12.1 The Client may not leave without signing.<br>
    12.2 This is a strict policy.<br>
    12.3. We cannot bring you back from your earlier experiences to the present for we will be sued for stealing Back to the Future material.<br>
    12.4 We tried being flexible once. Men in Black were called in again and it was a very messy affair. I can't recall anything about it now though.<br>
    12.5 <strong style="font-size: 1.2rem; color: #ff5555;">If you do not sign this document, you will be subject to hearing Sid Sriram's greatest hits on a perpetual loop.</strong>`
];

const scenes = {
    start: async () => {
        changeVibe('chapter1');
        await addMessage('Interviewer', "Welcome to the Amelia Project. We help people disappear. We fake deaths, orchestrate elaborate disappearances, and provide a clean slate for the criminally misunderstood or the exceptionally bored. How may I help you today, Miss…");
        showForm("Enter your name (e.g. Pockie)", "Continue", (name, avatar) => {
            if (name) playerName = name;
            else playerName = "Pockie";
            playerAvatar = avatar;
            playScene('scene2');
        });
    },
    scene2: async () => {
        clearStory();
        await addMessage('Player', `${playerName}. The name's ${playerName}. It's my birthday today and-`);
        await addMessage('Interviewer', "Well shine my light and call me bright! How wonderful! Happy birthday! I'm afraid we're not in the business of throwing parties yet, but the best I can do is attempt to be a substitute for friends and family and offer you some hot chocolate. It's a 70% dark blend with a hint of sea salt and the tears of a failed poet.");
        showChoices([
            { text: "Who'd say no to hot chocolate?", nextScene: 'scene3' },
            { text: "If you guys are as quick and effective as advertised, I'd hope this is poisoned.", nextScene: 'scene3' },
            { text: "No.", nextScene: 'gameOver1' }
        ]);
    },
    gameOver1: async () => {
        clearStory();
        await addMessage('System', "Are you crazy? You refused the hot chocolate. The Amelia Project considers this a grave insult. Game Over.");
        showChoices([{ text: "Restart", nextScene: 'start' }]);
    },
    scene3: async () => {
        clearStory();
        await addMessage('Player', "*Takes a sip* Mmm, this is wonderful. Now, as I was saying, no, I'm not here for a party. You see, I'm now another year older, though I don't feel older! I'm not older! Objectively! I want to sue time! But I'm unable to find any lawyer who'd fight my case.");
        await addMessage('Interviewer', "Mhm, go on.");
        await addMessage('Player', "So then I thought about freezing time, but that'd mean everything'd be still and that's boring. So I want you to put me back in time.");
        await addMessage('Interviewer', "Put you back in time? Hmmm… Well, that presents somewhat of a problem. I'd ask why, but in the interest of time and inducing an existential crisis, we'll do it-");
        await addMessage('Player', "Great. Now, what do I do? Shazam? Twist a time turner?");
        await addMessage('Interviewer', "Patience, patience. Well, I’ll spare you the intricacies of the physics, but essentially, it’s impossible to time travel and we don’t have a physics department yet. The last time we tried, we sent poor Bob to the stone ages and unless you’d be happy living among dinosaurs, we don’t want to take that risk again. Though, seeing how old you are now, I’d say you’d fit perfectly with them.");
        await addMessage('Player', "HEY!");
        await addMessage('Interviewer', "Pardon, pardon. Well, what I can do is place you in your childhood memories. That'd be easy to control, and it's technically being frozen in time. What do you say?");
        showChoices([
            { text: "Hmmm, I'm not sure.", nextScene: 'scene4' },
            { text: "I think I'll pass.", nextScene: 'gameOver2' },
            { text: "Sure! I'm in!", nextScene: 'scene4' }
        ]);
    },
    gameOver2: async () => {
        clearStory();
        await addMessage('System', "You decided to pass. You walked out and aged another year instantly from the stress of it all. Game Over.");
        showChoices([{ text: "Restart", nextScene: 'start' }]);
    },
    scene4: async () => {
        clearStory();
        await addMessage('Interviewer', "Well, the process is fairly simple. You sign a simple contract, and we prepare you for the jump. Read the contract, and sign at the bottom.");

        let currentPage = 0;

        const contractDiv = document.createElement('div');
        contractDiv.className = 'contract-container';
        contractDiv.id = 'contract-block';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'contract-content';

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'contract-controls';

        contractDiv.appendChild(contentDiv);
        contractDiv.appendChild(controlsDiv);
        storyArea.appendChild(contractDiv);

        function renderPage() {
            contentDiv.innerHTML = contractPages[currentPage];

            const nameSpan = document.getElementById('contract-name');
            if (nameSpan) nameSpan.textContent = playerName;

            controlsDiv.innerHTML = '';

            if (currentPage < contractPages.length - 1) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'submit-btn';
                nextBtn.textContent = 'Next Page ➔';
                nextBtn.onclick = () => {
                    currentPage++;
                    renderPage();
                    storyArea.scrollTop = storyArea.scrollHeight;
                };
                controlsDiv.appendChild(nextBtn);
                clearInteractive(); // keep it clear while reading
            } else {
                showChoices([
                    { text: "Sign here", nextScene: 'scene5' },
                    { text: "Don't sign", onClick: () => playScene('scene4b') }
                ]);
            }
        }

        renderPage();
        storyArea.scrollTop = storyArea.scrollHeight;
    },
    scene4b: async () => {
        clearStory();
        document.body.classList.add('glitch');
        await addMessage('System', "🎶 [PLAYING SID SRIRAM'S GREATEST HITS ON LOOP] 🎶");

        // Play the sid sriram audio track
        let sriramAudio = new Audio('static/audio/sidsriram.mp3');
        sriramAudio.loop = true;
        sriramAudio.play().catch(e => console.log("Audio file missing or blocked", e));

        setTimeout(() => {
            document.body.classList.remove('glitch');
            showChoices([{
                text: "FINE, FINE. I'LL SIGN.", onClick: () => {
                    sriramAudio.pause();
                    playScene('scene5');
                }
            }]);
        }, 3000);
    },
    scene5: async () => {
        clearStory();
        await addMessage('Interviewer', "Good! Now, with that out of the way, what's your favorite franchise?");
        showFranchiseChoices();
    },
    starTrek: async () => {
        clearStory();
        state.starTrekAttempts++;
        await addMessage('System', "Initiating Space Blasters Mini-Game...");

        clearInteractive();

        const gameContainer = document.createElement('div');
        gameContainer.style.textAlign = 'center';
        gameContainer.style.padding = '20px';

        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        canvas.style.background = '#000';
        canvas.style.border = '2px solid var(--accent)';
        canvas.style.borderRadius = '8px';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto 10px';
        canvas.style.cursor = 'crosshair';

        const instruction = document.createElement('p');
        instruction.textContent = "Click to shoot all asteroids to clear the wave. Clear 5 waves to win.";
        instruction.style.fontFamily = "monospace";
        instruction.style.color = "var(--text-secondary)";

        gameContainer.appendChild(canvas);
        gameContainer.appendChild(instruction);
        interactiveArea.appendChild(gameContainer);

        const ctx = canvas.getContext('2d');
        let currentWave = 1;
        const maxWaves = 5;
        let asteroids = [];
        let gameLoop;

        function spawnWave(waveNum) {
            asteroids = [];
            for (let i = 0; i < waveNum + 2; i++) {
                asteroids.push({
                    x: Math.random() * 360 + 20,
                    y: Math.random() * 100,
                    radius: 15 + Math.random() * 15,
                    dx: (Math.random() - 0.5) * (2 + waveNum * 0.5),
                    dy: Math.random() * (1 + waveNum * 0.5) + 0.5
                });
            }
        }

        spawnWave(currentWave);

        let lasers = [];

        canvas.onmousedown = (e) => {
            if (currentWave > maxWaves) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            lasers.push({ x: x, y: y, frames: 5 });

            for (let i = asteroids.length - 1; i >= 0; i--) {
                const a = asteroids[i];
                const dist = Math.hypot(a.x - x, a.y - y);
                if (dist < a.radius + 15) {
                    asteroids.splice(i, 1);
                    playSFX('static/audio/glass_shatter.mp3');

                    if (asteroids.length === 0) {
                        currentWave++;
                        if (currentWave > maxWaves) {
                            cancelAnimationFrame(gameLoop);
                            ctx.fillStyle = "rgba(0,0,0,0.8)";
                            ctx.fillRect(0, 0, 400, 300);
                            ctx.fillStyle = "var(--accent)";
                            ctx.font = "bold 24px monospace";
                            ctx.textAlign = "center";
                            ctx.fillText("MISSION ACCOMPLISHED!", 200, 150);

                            setTimeout(async () => {
                                await addMessage('System', "5 rounds complete. Isn't this too boring and nerdy?");
                                showFranchiseChoices(true);
                            }, 2000);
                        } else {
                            // wait a sec then spawn next wave
                            setTimeout(() => spawnWave(currentWave), 1000);
                        }
                    }
                    break;
                }
            }
        };

        function update() {
            if (currentWave > maxWaves) return;
            ctx.clearRect(0, 0, 400, 300);

            // Draw player ship
            ctx.fillStyle = '#0ff';
            ctx.beginPath();
            ctx.moveTo(200, 280);
            ctx.lineTo(185, 300);
            ctx.lineTo(215, 300);
            ctx.fill();

            // Draw lasers
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 3;
            for (let i = lasers.length - 1; i >= 0; i--) {
                const l = lasers[i];
                ctx.beginPath();
                ctx.moveTo(200, 280);
                ctx.lineTo(l.x, l.y);
                ctx.stroke();
                l.frames--;
                if (l.frames <= 0) lasers.splice(i, 1);
            }

            // Draw score
            ctx.fillStyle = '#fff';
            ctx.font = '16px monospace';
            ctx.textAlign = 'left';
            if (asteroids.length === 0 && currentWave <= maxWaves) {
                ctx.fillText(`Wave ${currentWave} Cleared!`, 10, 20);
            } else {
                ctx.fillText(`Wave: ${currentWave}/${maxWaves} | Targets: ${asteroids.length}`, 10, 20);
            }

            // Draw and update asteroids
            asteroids.forEach(a => {
                a.x += a.dx;
                a.y += a.dy;

                if (a.x < 0 || a.x > 400) a.dx *= -1;
                if (a.y > 320) {
                    a.y = -20;
                    a.x = Math.random() * 360 + 20;
                }

                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.arc(a.x - a.radius * 0.3, a.y - a.radius * 0.2, a.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            });

            gameLoop = requestAnimationFrame(update);
        }
        update();
    },
    lotr: async () => {
        clearStory();
        await addMessage('System', "▶ Playing epic Lord of the Rings cinematic clip... (Imagine majestic mountains and a swelling orchestral score)");
        showChoices([
            { text: "Keep going", nextScene: 'lotrContinue' },
            { text: "Actually, I haven't watched it YET. Let's do Breaking Bad instead.", nextScene: 'breakingBad' }
        ]);
    },
    lotrContinue: async () => {
        clearStory();
        await addMessage('System', "Unfortunately, the eagles didn't drop you off in the right timeline. Let's redirect you.");
        playScene('breakingBad');
    },
    breakingBad: async () => {
        clearStory();
        await addMessage('Interviewer', "Ah, chemistry. The study of change. How poetic for someone who wants to stay the same. Very well. Do hold on to something.");
        showChoices([
            { text: "Enter Chapter 2", nextScene: 'chapter2_start' }
        ]);
    },
    // ---- CHAPTER 2 ----
    chapter2_start: async () => {
        clearStory();
        changeVibe('chapter2', 'static/images/desert_bg.jpg');

        playSFX('static/audio/fall_wind.mp3');
        await addMessage('System', "You fall.");
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('System', "You keep falling.");
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('Narrator', "You look down. The ground is still nowhere in sight.");
        await addMessage('Narrator', "You look up. The Interviewer's office is the size of a postage stamp, and shrinking. Ope, you're gonna fa-");

        playSFX('static/audio/splat.mp3');
        await addMessage('System', "SPLAT.");
        await addMessage('Narrator', "A soft landing. Odd… You sit up. You are sticky all over.");
        await addMessage('Narrator', "You look at the ground and the ground is… apparently, a road. New Mexico sun, eh?");
        await addMessage('System', "The road is steaming gently.");

        await addMessage('Tortoise', "My apologies. The asphalt was meant to break your fall. We did not anticipate it would keep you. Onward.");
        await addMessage('Narrator', "You stand up. You're still black and sticky and smell like tar. You appear to be on a desert highway. The entire world has turned… kinda warm, Mexico yellow. The sky is clear. Perhaps too clear. There are mountains in the distance.");
        await addMessage('System', "There are two directions.");

        showChoices([
            {
                text: "Go Left", onClick: async () => {
                    clearInteractive();
                    await addMessage('Tortoise', "What? There's nothing left. (You must think I'm funny.) Right is the right choice.");
                    setTimeout(() => playScene('chapter2_rv'), 2000);
                }
            },
            { text: "Go Right", onClick: () => {
                setTimeout(() => playScene('chapter2_rv'), 2000);
            }}
        ]);
    },
    chapter2_rv: async () => {
        clearStory();
        playSFX('static/audio/desert_wind.mp3');
        await addMessage('Narrator', "Eventually, on the horizon, is a vehicle. It's an RV! It is bright purple and yellow and in the wrong shape.");
        await addMessage('Narrator', "There is a chimney on top! Smoke is curling out of the chimney suggesting something inside is being made with great care and possibly love.");
        await addMessage('Narrator', "Could this be… a remote chocolate factory? Like Willy Wonka? In the desert? Or the Witch’s hut from Hansel and Gretel?");
        await addMessage('Narrator', "You're hungry and you're sticky. You decide it's worth investigating. You walk up to the RV.");
        await addMessage('Narrator', "You knock politely on the door. You prepare yourself to ask for directions and maybe some chocolate and-");

        await addMessage('System', "THWACK.");
        await addMessage('Narrator', "Something hits you very firmly in the back of the head. The desert tilts. The RV gets small. The tortoise, in the distance, judges you.");

        document.body.style.opacity = 0;
        setTimeout(() => {
            document.body.style.opacity = 1;
            playScene('chapter2_wakeup');
        }, 3000);
    },
    chapter2_wakeup: async () => {
        clearStory();
        await addMessage('Narrator', "The smell is hot polyester, gasoline, and the back of an RV that has been baking in the New Mexico sun for three hours. You open your eyes.");
        await addMessage('Narrator', "You are wearing a yellow hazmat suit. The hood is pulled back. There is a respirator dangling around your neck. Your hands are in chemical gloves.");
        await addMessage('Narrator', "A young man in his mid-twenties is shaking your shoulder. He has a beanie. He is vibrating at a frequency that suggests a great deal of coke and a small amount of recent sleep.");

        const jesse = "Jesse";
        await addMessage(jesse, "Yo. You're finally up. Mr. White's gonna be here in like, two minutes, and you're clocking out? What are you doing? Are you having a moment? You can't have a moment. Not now.");
        await addMessage('Narrator', "You touch the back of your head. There is a lump.");
        await addMessage('Player', "What? Where am I?");
        await addMessage(jesse, "Yeah, sorry about that, that was me. You were sneaking up on the RV, I was, like, defending the perimeter. Don't worry about it. Anyway, did you get the flask? Tell me you got the flask. He's gonna lose it, yo, if you didn't-");

        showChoices([
            { text: "Pick the Volumetric flask", nextScene: 'chapter2_wrongflask' },
            { text: "Pick the Conical flask", nextScene: 'chapter2_wrongflask' },
            { text: "Pick the Round-bottom flask", nextScene: 'chapter2_correctflask' }
        ]);
    },
    chapter2_wrongflask: async () => {
        clearStory();
        playSFX('static/audio/glass_shatter.mp3');
        await addMessage('System', "<glass explodes>");
        await addMessage("Jesse", "Yo. YO. WHAT THE HECK, B***H?!?!THE DEA'S HERE!!!!");
        await addMessage('System', "(Distant siren. Distant explosion. Game Over.)");
        showChoices([{ text: "Try again", nextScene: 'chapter2_wakeup' }]);
    },
    chapter2_correctflask: async () => {
        clearStory();
        await addMessage("Jesse", "Great job, yo. Now we wait for Mr. White.");
        await addMessage('Player', "Yeah, yeah. I got it covered.");
        setTimeout(() => playScene('chapter2_mrwhite'), 1500);
    },
    chapter2_mrwhite: async () => {
        clearStory();
        playSFX('static/audio/rv_door.mp3');
        await addMessage('System', "A car door slams outside. The RV door opens. A man in a porkpie hat steps inside. He is not wearing the hat ironically.");
        await addMessage('System', "He is in his mid-fifties, balding, eyes the specific cold of a high-school chemistry teacher who has just been diagnosed with stage-three lung cancer and who is, for reasons he is not yet ready to admit to himself, having the time of his life.");
        await addMessage('Narrator', "Walter White looks at you. Walter White looks at the round-bottom flask on the table. Walter White looks at you again.");

        const walt = "Walt";
        await addMessage(walt, "Who are you? Jesse couldn’t have done this. <looks at Jesse> Jesse, what have I told you about bringing other peop-");
        await addMessage("Jesse", "Cool your bald head, Mr. White. This kid’s the bomb.");
        await addMessage(walt, "Are you? <looks at you coldly> Do you know who you are talking to right now? Who is it you think you see? Do you know how much I make a year? I mean, even if I told you, you wouldn't believe it. <Pause> SAY MY NAME.");

        showInput("Enter name...", "Say it", (ans) => {
            if (ans.toLowerCase() === 'heisenberg') {
                playScene('chapter2_heisenberg');
            } else {
                addMessage(walt, "No. Try again.").then(() => {
                    setTimeout(() => playScene('chapter2_mrwhite_name_retry'), 1000);
                });
            }
        });
    },
    chapter2_mrwhite_name_retry: async () => {
        clearStory();
        showInput("Enter name... (Hint: Heisenberg)", "Say it", (ans) => {
            if (ans.toLowerCase() === 'heisenberg') {
                playScene('chapter2_heisenberg');
            } else {
                playScene('chapter2_mrwhite_name_retry');
            }
        });
    },
    chapter2_heisenberg: async () => {
        clearStory();
        const walt = "Walt";
        await addMessage(walt, "You’re goddamn right. Now, do you have any experience in chemistry?");
        await addMessage('Player', "I got through AP chem if that counts.");
        await addMessage(walt, "Great. Another immature kid in this operation. Jesse thinks we should keep you. If it were up to me…");
        await addMessage('System', "He doesn't finish the sentence. He does not have to. The sentence finishes itself in the silence between you.");
        await addMessage('System', "Walt does not pause for effect. Walt pauses because he is waiting, and his waiting is its own kind of gravity.");
        await addMessage(walt, "Tell me. The synthesis we're running. We need to balance the precursor combustion. Methylamine. Oxygen.");
        await addMessage(walt, "Standard products; carbon dioxide, water, and nitrogen. First principles. Do you think you can do that?");
        await addMessage('Player', "Yeah. I can do that.");
        await addMessage(walt, "Good. Get a batch ready.");

        // Equation Minigame
        setTimeout(() => playScene('chapter2_equation'), 2000);
    },
    chapter2_equation: async () => {
        clearStory();
        await addMessage('System', "Minigame: Balance the Equation. __ CH₃NH₂ + __ O₂ → __ CO₂ + __ H₂O + __ N₂");
        state.chemAttempts = 0;
        showEquationMinigame();
    },
    chapter2_after_equation: async () => {
        clearStory();
        playSFX('static/audio/success_chime.mp3');
        const walt = "Walt";
        await addMessage(walt, "Wonderful.");

        playSFX('static/audio/glass_shatter.mp3');
        await addMessage('System', "<BOOM.>");
        await addMessage('Narrator', "The flask cracks. Vapour everywhere. Jesse hits the deck.");
        await addMessage('Narrator', "Walt does not flinch; he just stands there in the smoke like a man who has spent thirty years standing in front of teenage chemistry experiments and has, frankly, seen worse.");
        await addMessage(walt, "The equation is correct!");
        await addMessage('System', "<Player tries again. Same equation. Same answer. This time it works without the explosion. Or with a smaller, more dignified one.>");

        await addMessage('Narrator', "A small tray of crystals appears, blue as a swimming pool at four in the morning, faintly humming.");
        await addMessage("Jesse", "HELL YEAH. That's what I'm TALKING about, B&*#@! Look at that. Look at the shine on that, yo. That is- that is art. That is, like, a museum, but for- <Jesse picks up a crystal and is moving it toward his mouth.>");
        await addMessage(walt, "Jesse!!!");
        await addMessage('System', "<Jesse freezes mid-motion, crystal an inch from his lips.>");
        await addMessage("Jesse", "…I was smelling it.");
        await addMessage(walt, "You were not.");
        await addMessage("Jesse", "I was definitely smelling it.");
        await addMessage(walt, "Now. I have to go contact Tuco. <Walt looks at Jesse. The look is heavy.> Jesse. Stay here. Protect the product. Do not try anything. We do not touch our own product.");
        await addMessage("Jesse", "Yeah, Mr. White.");
        await addMessage(walt, "Jesse.");
        await addMessage("Jesse", "Yeah!!! Mr. White.");

        playSFX('static/audio/rv_door.mp3');
        await addMessage('System', "Walt steps out. The RV door closes. The car starts. The car drives away. Three seconds of silence. Jesse turns to you.");

        setTimeout(() => playScene('chapter2_offer'), 2000);
    },
    chapter2_offer: async () => {
        clearStory();
        await addMessage("Jesse", "Yo. Wanna try out the product? You know, to make sure it's good?");
        await addMessage('Player', "But… we're not supposed to try our own product.");
        await addMessage("Jesse", "Yeah, I know, I know, but, like, it's, it's quality control. We owe it to the customer. We're, like, professionals.");
        await addMessage("Jesse", "We're owe-it-to-the-customer professionals. It's the same thing your dentist does. Probably. Don't quote me on that.");
        await addMessage('Narrator', "Jesse picks up a crystal between his fingers. The crystal is the blue of a swimming pool at four in the morning. The crystal is, against all chemistry, very faintly humming.");
        await addMessage("Jesse", "C'mon. Just a taste. Mr. White's gonna be like an hour. He'll never know.");

        showChoices([
            { text: "Try it.", nextScene: 'chapter2_tryit' },
            { text: "Don't. ", nextScene: 'chapter2_dont' }
        ]);
    },
    chapter2_tryit: async () => {
        clearStory();
        await addMessage('Narrator', "You take the crystal between your fingers. You put it in your mouth. It tastes like static.");
        await addMessage('Narrator', "It tastes like the back of a freezer. It tastes, and this is the part you will not be able to explain later, like the colour of your favourite mug.");
        await addMessage('Narrator', "Jesse takes one too. Jesse is going to be fine. Jesse has done this before. You, however, have not.");
        await addMessage('Narrator', "The RV walls go soft. The flask on the table tips, gently, of its own accord. Liquid spills out and does not spill.");
        await addMessage('Narrator', "It hangs there. It is the wrong colour. It is several wrong colours, in sequence, like a channel changing.");
        await addMessage("Jesse", "(distantly) ...dude, are the walls supposed to spiral?");
        await addMessage('System', "The bathroom door of the RV opens by itself. Behind it is a long, oak-panelled hallway. Hallway. In the bathroom. Of an RV.");
        await addMessage('System', "Jesse is fading. Or you are.");

        showChoices([{ text: "Proceed to Chapter 3", onClick: () => playScene('chapter3_hallway') }]);
    },
    chapter2_dont: async () => {
        clearStory();
        await addMessage('Player', "Pass.");
        await addMessage('Narrator', "You shake your head.");
        await addMessage("Jesse", "What? C'mon, are you serious? Fine. More for me, then. Selfish, but fine.");
        await addMessage('Narrator', "Jesse pops the crystal into his mouth like it's a Tic Tac. Within four seconds his eyes start doing something interesting.");
        await addMessage('Narrator', "Within seven, he is humming. Within ten, he has slid down the wall of the RV and is sitting on the floor, contemplating something on the ceiling that, you are fairly sure, is not actually there.");
        await addMessage("Jesse", "…yo. Yo, did you know there's no cure for dandruff?");
        await addMessage('Narrator', "You step over Jesse, who waves at you cheerfully.");

        playSFX('static/audio/rv_door.mp3');
        await addMessage('System', "The RV door swings open of its own accord. Walt storms in.");

        const walt = "Walt";
        await addMessage(walt, "Jesse, we need to- sees Jesse on the floor -what the heck have you done? Shoot. Kid are you high?? How old are you?");
        await addMessage('Player', "18.");
        await addMessage('System', "<HEY, I THOUGHT THIS WASN'T SUPPOSED TO MAKE ME FEEL OLDER!>");
        await addMessage('Interviewer', "I'm sorry, we need this for plot progression.");

        showChoices([{ text: "HMPHHHH.", nextScene: 'chapter2_dont_continue' }]);
    },
    chapter2_dont_continue: async () => {
        clearStory();
        const walt = "Walt";
        await addMessage(walt, "OK, kid, here's the deal. Saul's stuck in some legal drama, OK? He's looking for jurors and nobody is willing to help him out.");
        await addMessage('Player', "Why don't you volunteer?");
        await addMessage(walt, "Are you listening to yourself? Who likes jury duty? Come on, we don't have time.");

        showChoices([{ text: "Proceed to Jury Duty", onClick: () => playScene('chapter3b_drive') }]);
    }
};

function showEquationMinigame() {
    clearInteractive();
    const container = document.createElement('div');
    container.className = 'form-container';

    const eqDiv = document.createElement('div');
    eqDiv.style.fontSize = '1.2rem';
    eqDiv.style.marginBottom = '1rem';
    eqDiv.style.fontFamily = 'monospace';

    // Inputs
    const i1 = document.createElement('input'); i1.style.width = '30px'; i1.className = 'input-field';
    const i2 = document.createElement('input'); i2.style.width = '30px'; i2.className = 'input-field';
    const i3 = document.createElement('input'); i3.style.width = '30px'; i3.className = 'input-field';
    const i4 = document.createElement('input'); i4.style.width = '30px'; i4.className = 'input-field';
    const i5 = document.createElement('input'); i5.style.width = '30px'; i5.className = 'input-field';

    eqDiv.appendChild(i1); eqDiv.appendChild(document.createTextNode(' CH₃NH₂ + '));
    eqDiv.appendChild(i2); eqDiv.appendChild(document.createTextNode(' O₂ → '));
    eqDiv.appendChild(i3); eqDiv.appendChild(document.createTextNode(' CO₂ + '));
    eqDiv.appendChild(i4); eqDiv.appendChild(document.createTextNode(' H₂O + '));
    eqDiv.appendChild(i5); eqDiv.appendChild(document.createTextNode(' N₂'));

    const btn = document.createElement('button');
    btn.className = 'submit-btn';
    btn.textContent = 'Synthesize';

    const walt = "Walt";

    btn.onclick = async () => {
        const ans = [i1.value, i2.value, i3.value, i4.value, i5.value].map(v => v.trim());
        if (ans[0] == '4' && ans[1] == '9' && ans[2] == '4' && ans[3] == '10' && ans[4] == '2') {
            clearInteractive();
            playScene('chapter2_after_equation');
        } else {
            state.chemAttempts++;
            let msg = "Try again.";
            if (state.chemAttempts === 2) msg = `${playerName}. The atoms have to balance. The atoms always balance. That's the only thing in this entire kitchen that I can promise you.`;
            else if (state.chemAttempts === 3) {
                await addMessage(walt, "(looks at Jesse) You said this one knew chemistry.");
                await addMessage("Jesse", "(defensive) They do, they do, Mr. White, they're just having a momen-");
                await addMessage(walt, "Jesse.");
                await addMessage("Jesse", "Right.");
                return;
            }
            else if (state.chemAttempts === 4) msg = "Count the nitrogens. Then the carbons. Then the hydrogens. Oxygen comes last, because oxygen is the one that bends.";
            else if (state.chemAttempts === 5) msg = "I'll give you the nitrogens. Two on the right. Work backward.";
            else if (state.chemAttempts === 6) msg = "I am genuinely starting to lose respect for you.";
            else if (state.chemAttempts >= 7) {
                msg = "Four. Nine. Four. Ten. Two. Try not to forget it.";
                i1.value = '4'; i2.value = '9'; i3.value = '4'; i4.value = '10'; i5.value = '2';
            }
            await addMessage(walt, msg);
        }
    };

    container.appendChild(eqDiv);
    container.appendChild(btn);
    interactiveArea.appendChild(container);
}

function showFranchiseChoices(hideStarTrek = false) {
    let choices = [];
    if (!hideStarTrek) {
        choices.push({ text: "Star Trek", nextScene: 'starTrek' });
    }
    choices.push({ text: "Breaking Bad", nextScene: 'breakingBad' });
    choices.push({ text: "Lord of the Rings", nextScene: 'lotr' });
    showChoices(choices);
}

function playScene(sceneName, isRewind = false) {
    if (scenes[sceneName]) {
        if (!isRewind) {
            gameHistory.push({
                sceneName,
                storyHtml: storyArea.innerHTML,
                state: JSON.parse(JSON.stringify(state)),
                globals: { playerName, playerAvatar },
                vibe: document.body.getAttribute('data-theme'),
                bg: document.body.style.backgroundImage
            });
        }

        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) undoBtn.style.display = gameHistory.length > 1 ? 'block' : 'none';

        scenes[sceneName]();
    }
}

function undoScene() {
    if (gameHistory.length <= 1) return;

    // Remove current scene
    gameHistory.pop();
    // The previous scene is now at the top
    const prev = gameHistory.pop();

    // Restore variables
    state = JSON.parse(JSON.stringify(prev.state));
    playerName = prev.globals.playerName;
    playerAvatar = prev.globals.playerAvatar;
    document.body.setAttribute('data-theme', prev.vibe || '');
    document.body.style.backgroundImage = prev.bg || '';

    // Restore DOM to exactly before that scene started
    storyArea.innerHTML = prev.storyHtml;

    // Play it again
    playScene(prev.sceneName);
}

// Start game
window.onload = () => {
    playScene('start');
};

// --- CHAPTER 3B EXTENSION ---
Object.assign(scenes, {
    chapter3b_drive: async () => {
        clearStory();
        changeVibe('chapter2', 'static/images/desert_bg.jpg'); // Can reuse desert vibe for New Mexico
        
        await addMessage('System', "Chapter 3B: Jury Duty (and Other Crimes Against Humanity)");
        await addMessage('System', "Scene 1: The Drive");
        
        await addMessage('Narrator', "Walt's car is a 2004 Pontiac Aztek. The desert rolls past.");
        const walt = "Walt";
        await addMessage(walt, "Saul Goodman is the worst best lawyer in the state. The order matters. He's short a juror. All you have to do is sit. Listen. Vote when they tell you to vote. Don't talk to the press. Don't talk to the defendant. Don't, under any circumstances, like Saul. Liking Saul is the first sign of something serious.");
        await addMessage('Player', "Why are you helping him?");
        await addMessage('Narrator', "Walt does not answer for a long second. The Aztek goes over a bump that no other car would have noticed.");
        await addMessage(walt, "Saul is useful. To me.");
        await addMessage('Narrator', "A pause.");
        await addMessage(walt, "And I have things I need a lawyer for, in the near future. The kind of lawyer I need is the kind of lawyer who owes me. So I am, broadly speaking, investing.");
        await addMessage('Narrator', "You decide not to ask follow-up questions.");
        await addMessage('Narrator', "The Aztek pulls into the courthouse parking lot. Walt does not turn off the engine.");
        await addMessage(walt, "I'm not coming in. Saul will find you. You won't have to find Saul. Saul is essentially weather. He will arrive.");
        await addMessage('Narrator', "You step out. Walt, without ceremony, puts the Aztek into reverse. The Aztek pulls away.");
        await addMessage('Narrator', "The courthouse doors are already opening, and a man in a purple-yellow suit is already coming through them, already pointing at you, already talking.");
        
        const saul = "Saul Goodman";
        await addMessage(saul, "There you are! Walt called ahead. I did not believe Walt would ever call ahead. The man doesn't call, anyway. Walk and talk, kid. Eleven minutes till they call jury, and if you are not in that box when they call jury, I am going to have to use the alternates, and the alternates, sweetheart, are not going to make it through opening arguments alive. Walk!");
        await addMessage('Narrator', "He's already walking. You walk.");
        
        showChoices([{ text: "Enter the Courthouse", nextScene: 'chapter3b_jury_box' }]);
    },
    chapter3b_jury_box: async () => {
        clearStory();
        await addMessage('System', "Scene 2: The Jury Box");
        await addMessage('Narrator', "The courtroom of the County Superior Court is everything you expected of a county courthouse. Wood panelling that has not been forgiven. A water cooler that has been around since the first rain clouds on earth.");
        await addMessage('Narrator', "A laminated sign on the bailiff's desk reads BAILIFF ON LUNCH. The bailiff's chair is empty. A potted plant has been placed on the chair. The potted plant, is not on lunch.");
        
        const saul = "Saul Goodman";
        await addMessage('Narrator', "Saul propels you up the aisle with a hand on your shoulder.");
        await addMessage(saul, "Jury box, jury box, jury box, here we go, sit, sit. You are now Juror Number One. Congratulations, kid. Do not, do not, say anything until the judge addresses you. When he addresses you, smile. You have a good face. Use it. Smile at him the way you'd smile if you got a letter to Hogwarts. That smile. That's the one. Hold it.");
        await addMessage('Narrator', "You sit. You attempt the smile. The smile does not entirely arrive.");
        
        await addMessage('Narrator', "The judge enters. The judge is in his early sixties. His robe has been pressed by someone who took it personally. He sits. He surveys the courtroom. He sighs the specific sigh of a man who has read the docket and is already disappointed.");
        const judge = "Judge";
        await addMessage(judge, "Bailiff.");
        await addMessage('Potted Plant', "(silence)");
        await addMessage(judge, "…right. Bailiff is on lunch. Carry on. Counsel, the jury, please. We were down twelve, I'm told.");
        await addMessage(saul, "We were previously down twelve, Your Honour. I am pleased to report we have now identified a seated juror.");
        await addMessage(judge, "How many.");
        await addMessage(saul, "One.");
        await addMessage(judge, "One.");
        await addMessage(saul, "One is a number, Your Honour. It is, in fact, the first number.");
        await addMessage(judge, "Counsellor. One.");
        await addMessage(saul, "Your Honour, with respect, the Constitution does not, in fact, specify.");
        await addMessage(judge, "Bring up the panel. The full panel. I want to see the people you are calling to my courtroom. I want to understand.");
        await addMessage('Narrator', "A bailiff who is not on lunch leads in the available pool. There are seven of them.");
        await addMessage(judge, "While seven is a most wonderful number, this is abysmal. Anywho, I'm not paid to wait around and I need to go home.");
        await addMessage('Narrator', "Everyone is extremely respectful to one another and especially to the bailiff (still a plant), who lines them up.");
        
        showChoices([{ text: "Watch Jury Selection", nextScene: 'chapter3b_jury_selection' }]);
    },
    chapter3b_jury_selection: async () => {
        clearStory();
        const judge = "Judge";
        
        await addMessage('System', "One: A man in a long red coat, with eyeliner, and a hat that has had a complicated life. He is holding a bottle.");
        await addMessage(judge, "Name.");
        await addMessage('Captain Jack Sparrow', "Cap-tain Jack Sparrow. Savvy?");
        await addMessage(judge, "Are you drunk.");
        await addMessage('Captain Jack Sparrow', "I am. I take issue with the framing of that question, mate. Am I drunk now? No. Will I be drunk by the time you call jury? Yes, almost certainly. Have I, on a prior occasion, served jury duty drunk? Yes. Was justice served? Arguably. So, in the spirit of.");
        await addMessage(judge, "Dismissed.");
        await addMessage('Captain Jack Sparrow', "Brilliant. (exits, immediately uncorking the bottle)");
        
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('System', "Two: A small man with a particular moustache. Why! It's Hitler! There is a long silence. The judge stares. The judge's pen, which had been hovering, lowers itself slowly.");
        await addMessage(judge, "…you have got to be kidding me.");
        await addMessage('Narrator', "The juror opens his mouth.");
        await addMessage(judge, "Don't. Don't speak. Don't say a word.");
        await addMessage('Juror 2', "I.");
        await addMessage(judge, "Sir. I have one question. Are you, or have you ever stolen anything?");
        await addMessage('Juror 2', "Yes, and I'd do it again! For the Fatherland! Sie-");
        await addMessage(judge, "Dismissed. Get him out of my courtroom.");
        await addMessage('Narrator', "The bailiff hauls him out.");
        
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('System', "Three: A man in a long coat and a deerstalker. He has not been called yet. He is already speaking.");
        await addMessage('Sherlock Holmes', "Your Honour. Before we begin. I have already deduced the verdict. I deduced it in the parking lot. I noted the asymmetric scuffing on counsel's left shoe, the precise angle at which the defendant tilts his bald head when he breathes, the specific humidity of the bailiff's plant, and from these I have concluded, with absolute certainty, that the verdict will be.");
        await addMessage(judge, "Dismissed.");
        await addMessage('Sherlock Holmes', "I have not yet said the verdict.");
        await addMessage(judge, "That is why you are dismissed. Out. Out.");
        
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('System', "Four: A man in a beige cardigan. He looks, at all times, slightly sad. He looks at the floor.");
        await addMessage(judge, "Name.");
        await addMessage('Bartleby', "Bartleby.");
        await addMessage(judge, "Bartleby, will you serve on this jury today.");
        await addMessage('Bartleby', "I would prefer not to.");
        await addMessage(judge, "I'm not asking what you would prefer. I'm asking will you serve.");
        await addMessage('Bartleby', "I would prefer not to.");
        await addMessage(judge, "Bartleby.");
        await addMessage('Bartleby', "I would prefer not to.");
        await addMessage(judge, "(after a long silence) Dismissed.");
        await addMessage('Bartleby', "(quietly, on his way out) I would prefer not to be dismissed, also. But, given the situation.");
        
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('System', "Five: A woman in a beige cardigan. (The cardigans are starting to feel coordinated. They are not.)");
        await addMessage(judge, "Name.");
        await addMessage('Diane', "Diane. I'm a librarian. From Rio Rancho.");
        await addMessage(judge, "Diane, do you have any reason you cannot serve on this jury today.");
        await addMessage('Diane', "I have a casserole in the oven.");
        await addMessage(judge, "How long has it been in there.");
        await addMessage('Diane', "Two hours.");
        await addMessage(judge, "Diane. I would seat you. I would seat you, Diane. But that casserole is finished. Go save what you can.");
        await addMessage('Diane', "(after a long pause) …yeah.");
        await addMessage(judge, "Dismissed, Diane. With sympathy.");
        await addMessage('Narrator', "Diane exits at speed.");
        
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('System', "Six: A man in his mid-fifties, balding, in a porkpie hat. He is not wearing the hat ironically. He has the eyes of a high-school chemistry teacher who has, recently, found a second calling, and so on.");
        await addMessage('Narrator', "You sit up.");
        await addMessage(judge, "Name.");
        await addMessage('Walter White', "Walter White.");
        await addMessage(judge, "Mr. White, do you have any reason you cannot serve on this jury today.");
        await addMessage('Walter White', "I have stage-three lung cancer.");
        await addMessage('Narrator', "A long silence.");
        await addMessage(judge, "I'm sorry to hear that, Mr. White. Are you, on doctor's orders, advised against the cognitive load of jury service.");
        await addMessage('Walter White', "I am.");
        await addMessage(judge, "Do you have documentation.");
        await addMessage('Walter White', "(producing a folded sheet from his jacket) I do.");
        await addMessage('Narrator', "The judge takes the sheet. The judge reads the sheet. The judge looks at Walt. The judge looks at the sheet again.");
        await addMessage(judge, "Dismissed, Mr. White. With my sincerest wishes.");
        await addMessage('Walter White', "Thank you, Your Honour.");
        await addMessage('Narrator', "He turns. He walks down the aisle. He passes the jury box. He passes you. He does not look at you. He does, however, very faintly, nod once. The doors swing shut behind him.");
        
        await new Promise(r => setTimeout(r, 1000));
        await addMessage('System', "Seven: A man in his early thirties. The suit is grey, the shirt is white, the smile arrived ten minutes before he did.");
        await addMessage(judge, "Name.");
        await addMessage('Neal Caffrey', "Neal Caffrey, Your Honour.");
        await addMessage(judge, "Mr. Caffrey, do you have any reason you cannot serve on this jury today.");
        await addMessage('Neal Caffrey', "I would consider it an honour, Your Honour.");
        await addMessage('Narrator', "The judge looks at him for a long moment. The judge has been a judge for thirty-one years and has, in that time, developed certain instincts. The instincts are now, audibly, talking.");
        await addMessage(judge, "Mr. Caffrey. Are you aware of the nature of this case?");
        await addMessage('Neal Caffrey', "I am vaguely informed.");
        await addMessage(judge, "Mr. Caffrey, this case concerns alleged intellectual property infringement of a technique or form belonging to an extinct culture.");
        await addMessage('Neal Caffrey', "(very small pause) Stealing technique, you say?");
        await addMessage(judge, "Extinct.");
        await addMessage('Neal Caffrey', "Your Honour, I would like the record to reflect that I have a strong professional curiosity about cultural property whose original owners are no longer present to register objection.");
        await addMessage(judge, "Mr. Caffrey, I have not asked you any questions for which that is the answer.");
        await addMessage('Neal Caffrey', "I'm just getting ahead of it, Your Honour.");
        await addMessage(judge, "Mr. Caffrey, will you commit to me, on the record, that under no circumstances during these proceedings will you attempt to acquire, copy, transcribe, photograph, or otherwise come into possession of the forms, sequences, or named techniques that are the subject of this case.");
        await addMessage('Narrator', "A long silence.");
        await addMessage('Neal Caffrey', "…I would not feel comfortable making that representation, Your Honour.");
        await addMessage(judge, "Dismissed.");
        await addMessage('Neal Caffrey', "(rising, smoothing his jacket) Pleasure, Your Honour. Always a pleasure.");
        await addMessage('Narrator', "He passes the jury box. He passes you. He nods at you. The nod is very different from Walt's nod. The nod says I see you. We are, in some sense, in the same line of work. You have absolutely no idea what he means by this.");
        await addMessage('Narrator', "The doors swing shut behind him.");
        
        showChoices([{ text: "Watch the Judge's reaction", nextScene: 'chapter3b_trial_start' }]);
    },
    chapter3b_trial_start: async () => {
        clearStory();
        const judge = "Judge";
        const saul = "Saul Goodman";
        
        await addMessage(judge, "(to Saul) Counsellor. That was your panel.");
        await addMessage(saul, "Your Honour, with all due respect, everyone hates jury duty. I cannot manufacture jurors out of nothing. I am a lawyer, not a demiurge.");
        await addMessage(judge, "(very quietly) Counsellor, do not use the word demiurge in my courtroom.");
        await addMessage(saul, "Withdrawn.");
        await addMessage('Narrator', "The judge passes a hand over his face. He lifts it again. He has aged, visibly, in the last seven seconds.");
        await addMessage(judge, "One juror. One. Fine. Fine. I have presided over a trial with one juror exactly once in my career, and the appellate court was, I am pleased to inform you, charmed. Counsels, are we ready?");
        await addMessage('Narrator', "A second lawyer, who has been sitting at the plaintiff's table the entire time without moving, now stands. He is tidy. He is tidy in a way that suggests his tidiness has been a load-bearing wall in his life for a long time. A service dog at his feet looks up at him and then at you, and you have the unsettling sense that the dog has clocked something about you that nobody else in the room has yet.");
        
        const campbell = "Campbell Alexander";
        await addMessage(campbell, "Ready, Your Honour.");
        await addMessage(saul, "Ready, Your Honour.");
        await addMessage(judge, "Then let us begin.");
        
        showChoices([{ text: "Begin the Trial", onClick: () => {
            state.trialMoments = [];
            playScene('chapter3b_trial_moment_1');
        } }]);
    }
});

// Trial Moments Array
const trialMoments = [
    {
        speaker: "Campbell Alexander",
        text: "(opening for Aang) Your Honour. Member of the jury. The defendant has, for the past forty years, used a martial form he did not invent, did not earn, and was not taught. The form is airbending. It belongs, both as a matter of authorship and as a matter of cultural inheritance, to the Air Nomads. The Air Nomads, as the court is aware, have one surviving member. He is sitting at this table. He is twelve. He is asking the court for one remedy. An injunction. The defendant is to stop using what he stole."
    },
    {
        speaker: "Saul Goodman",
        text: "(opening for Voldemort) Your Honour. With respect. The plaintiff's claim has three doctrinal problems, and I would like to walk the court through them. Originality. My client is alleged to have copied a technique. Under Feist, originality protects expression, not technique. Idea-expression. Bending is, at most, an idea. Ideas are not copyrightable. Statute of limitations. The earliest alleged use is forty years ago. Every applicable limitation period has run, in every jurisdiction the court has access to. The plaintiff, before he asks the court for an injunction, must answer how this case is in front of the court at all."
    },
    {
        speaker: "Campbell Alexander",
        text: "Feist protects expression. The plaintiff's claim is in expression. The Air Nomad forms are named, choreographed, and recorded. Liu Yunfeng's Third Form. The Forty-Two Forms of the Eastern Air Temple. The Wandering-Cloud sequence. These are not ideas. These are fixed expressions in the sense the statute requires. As to limitations: my client was frozen in ice for one hundred years. Equitable tolling applies. The clock did not run on a plaintiff who was, on uncontested evidence, unconscious in glacial suspension."
    },
    {
        speaker: "Saul Goodman",
        text: "Your Honour, equitable tolling is a doctrine for plaintiffs who did not know of the harm. My client's harm was publicly visible. It was taught at his school. The plaintiff is asking the court to toll a limitations period because he personally was unavailable, while the world he claims to represent was very much present and could have brought this claim. Equitable tolling does not, with respect, turn on the plaintiff's body temperature."
    },
    {
        speaker: "Campbell Alexander",
        text: "Your Honour. The defendant has, on the public record, named one of the forms he uses the Riddle Sweep. Riddle is the defendant's birth surname. The defendant has renamed a stolen form after himself. Under the Lanham Act, this is reverse passing-off, taking another's work and presenting it as one's own. It is per se actionable. The defendant's own naming convention is, in this courtroom, a confession."
    },
    {
        speaker: "Saul Goodman",
        text: "Your Honour. The Riddle Sweep is a family designation used in informal training contexts and has never been published or commercially deployed. Reverse passing-off requires commerce. My client does not, in any sense the Lanham Act recognises, trade in airbending. He uses it. Defensively. Sometimes. Generally. On occasion."
    },
    {
        speaker: "Campbell Alexander",
        text: "Your Honour, I'd like to call the court's attention to a piece of physical evidence. (turns toward the defence table) The defendant. The defendant's head. An air master, on completion of the formal airbending discipline at any of the Four Air Temples, is given a master's tattoo. A blue arrow on the forehead, extending the length of the spine, and along each limb. The tattoo is the visible mark of completed initiation. It is, by Air Nomad custom of two thousand years, the sole documentary record of mastery. (beat) The defendant's head is bare. The defendant's hands are bare. The defendant has no air temple tattoo. The defendant was never tattooed there. Because the defendant was never initiated. He has the bald scalp of a master and none of the marks. He took the knowledge. He never earned it. The evidence, Your Honour, is on his head."
    },
    {
        speaker: "Saul Goodman",
        text: "(after a long beat) Your Honour. The absence of a tattoo is, with respect, not evidence of theft. It is evidence of not having a tattoo. My client could have been initiated by a master who did not tattoo him, by a tradition that we do not have access to, by methods the plaintiff is unaware of. The plaintiff's chain of inference is: no tattoo, therefore no master, therefore theft. That is three logical leaps in a single sentence. I would like to introduce one alternative explanation, freely, on the record. Self-teaching. My client read a book. The plaintiff has not entered into evidence the proposition that airbending requires a teacher."
    },
    {
        speaker: "Voldemort",
        text: "I did not steal it. I was given it. By the spirits. Who recognised in me a power equal to their own. The Air Nomads were, frankly, a soft people. They taught their forms to children, who used them to float over flowers and direct their burps at their teachers. I have used them in combat. I have advanced the form. If anything, I should be compensated for improvements made to a discipline its founders had let stagnate. I do not see, in this courtroom, one claim by the plaintiff that I have made airbending worse. I have, in every measurable respect, made it more."
    },
    {
        speaker: "Campbell Alexander",
        text: "(closing for Aang) Your Honour. Member of the jury. The defendant has just admitted, on the record, the elements of the claim. He took the forms. He had no master. He has used them in ways contrary to the discipline of their origin. He believes himself entitled to do so. The case is now, in evidentiary terms, closed. What remains is the question of remedy. The plaintiff is not asking for damages. He is not asking for compensation. He is not asking, despite everything, for an apology. He is asking the court for one order. Stop. My client wants the forms back. Not the practice, the forms. The names. The sequences. The right to be the only living person who can teach them. The defendant retains, even under the strictest injunction, his life, his liberty, and every other martial discipline he has ever practiced. All my client is asking is that the defendant stop calling stolen movements his own."
    },
    {
        speaker: "Saul Goodman",
        text: "(closing for Voldemort) Your Honour. Juror. I want to be clear about what an injunction in this case would, in practice, require. It would require my client, and every wizard who has ever observed my client, and every wizard who has ever read about my client, to consciously suppress a movement integrated into wizarding combat for forty years. Enforcement would require prosecution of any defendant who, in the heat of a duel, moved the wrong way. I sympathise with the plaintiff. I want the record to reflect that I sympathise with the plaintiff. He is twelve. He has lost his civilisation. He is asking the smallest possible thing. (beat) But the court is asked to issue orders that can be enforced. And this order cannot be enforced. You do not give the world to a child by promising him what no court has the power to deliver. So let's be clear-eyed about what we are doing here. Then we can do it."
    }
];

// Add scenes for the 11 trial moments
for (let i = 0; i < trialMoments.length; i++) {
    scenes[`chapter3b_trial_moment_${i + 1}`] = async () => {
        clearStory();
        
        if (i === 0) {
            await addMessage('System', "Scene 3: The Trial");
            await addMessage('Narrator', "The plaintiff: Aang, last surviving Air Nomad. Twelve years old. Robe. Staff. Blue arrow tattoo. The defendant: Voldemort. Black robes, no nose, hairless head, no tattoos. He sits at the defence table beside Saul, who has, you note, positioned himself between Voldemort and the jury, in the manner of a parent shielding a child at a dinner party.");
        }
        
        const m = trialMoments[i];
        
        if (i === 8) {
            // Voldemort interjection special text
            await addMessage(m.speaker, "I did not steal it.");
            await addMessage('Saul Goodman', "Your Honour, my client is, with respect, exercising his right to remain silent at his own discretion.");
            await addMessage(m.speaker, m.text.substring(20)); // Skip first sentence
        } else {
            await addMessage(m.speaker, m.text);
        }

        if (i === 8) {
            await addMessage('Narrator', "Voldemort's interjection is not, strictly, an argument. It is, you note, the only thing said in the courtroom today that has caused his own counsel to physically wince.");
            await addMessage('Saul Goodman', "(eyes closed) Your Honour, my client is, ah, exercising his right to self-aggrandisement, which is not, technically, evidence, and which I would very much like the court to not consider as part of the factual record of these proceedings.");
            await addMessage('Judge', "It will stand.");
            await addMessage('Saul Goodman', "Of course it will.");
        }
        
        showSliderMinigame(i);
    };
}

function showSliderMinigame(momentIndex) {
    clearInteractive();
    
    const container = document.createElement('div');
    container.className = 'slider-minigame';
    
    const title = document.createElement('h3');
    title.innerText = `Rate the Argument (Slider ${momentIndex + 1}/11)`;
    title.style.margin = "0 0 10px 0";
    
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-5';
    slider.max = '5';
    slider.value = '0';
    slider.id = `slider-${momentIndex}`;
    
    const labels = document.createElement('div');
    labels.className = 'slider-labels';
    labels.innerHTML = `<span>-5 (Does Not Land)</span><span id="slider-val-${momentIndex}">0</span><span>+5 (Lands)</span>`;
    
    slider.oninput = (e) => {
        document.getElementById(`slider-val-${momentIndex}`).innerText = e.target.value > 0 ? '+' + e.target.value : e.target.value;
    };
    
    sliderContainer.appendChild(labels);
    sliderContainer.appendChild(slider);
    
    const textInput = document.createElement('textarea');
    textInput.className = 'counter-arg-input';
    textInput.placeholder = "Optional: Type your counter-argument here...";
    textInput.id = `counter-arg-${momentIndex}`;
    
    const btn = document.createElement('button');
    btn.className = 'submit-btn';
    btn.innerText = "Submit Judgment";
    
    btn.onclick = () => {
        state.trialMoments.push({
            moment: momentIndex,
            rating: parseInt(slider.value),
            counterArgument: textInput.value
        });
        
        if (momentIndex < 10) {
            playScene(`chapter3b_trial_moment_${momentIndex + 2}`);
        } else {
            playScene('chapter3b_post_trial');
        }
    };
    
    container.appendChild(title);
    container.appendChild(sliderContainer);
    container.appendChild(textInput);
    container.appendChild(btn);
    
    interactiveArea.appendChild(container);
}

Object.assign(scenes, {
    chapter3b_post_trial: async () => {
        clearStory();
        const judge = "Judge";
        await addMessage('Narrator', "The judge clears his throat.");
        await addMessage(judge, "Counsels rest? Good. The juror has heard enough. The juror, singular, will retire to the empty office, I suppose. Bailiff?");
        await addMessage('Potted Plant', "(silence)");
        await addMessage(judge, "Right. You. Juror. You have ten minutes. Or, we'll see how long. Make a decision. For the love of, please make a decision.");
        await addMessage('Narrator', "You stand. You walk toward the side door. You make it three steps.");
        
        showChoices([{ text: "Proceed", nextScene: 'chapter3b_brothers' }]);
    },
    chapter3b_brothers: async () => {
        clearStory();
        await addMessage('System', "Scene 4: The Brothers");
        await addMessage('Narrator', "The main doors of the courtroom slam open with the kind of force that only opens doors that have been waiting to be slammed open.");
        await addMessage('Narrator', "A man stands in the doorway. He is in a three-piece suit. He is wrapped in a medical-grade space blanket. He sneezes.");
        
        const chuck = "Chuck McGill";
        const saul = "Saul Goodman";
        const judge = "Judge";
        
        await addMessage(chuck, "JIMMY.");
        await addMessage('Narrator', "Saul, who had been gathering his papers, freezes. The papers freeze with him. One of them falls in slow motion. It does not land.");
        await addMessage(saul, "(very quietly, to himself) …oh, you have got to be.");
        await addMessage(chuck, "Jimmy. JIMMY. I can hear you. I can hear you breathing. Don't pretend you're not here. Hi, Jimmy.");
        await addMessage(saul, "Chuck, I'm working, Chuck.");
        await addMessage(chuck, "Working? Working? (turns to the room, takes in the lights, takes in the bailiff's empty chair, takes in the potted plant) Your Honour. Your Honour. I would like to report a crime.");
        await addMessage('Narrator', "The courtroom goes very still.");
        await addMessage(judge, "(after a long moment) …sir.");
        await addMessage(chuck, "Attempted murder, Your Honour. Attempted murder by way of electrocution. My brother. Jimmy. That man, (points at Saul, who is mouthing 'oh my god') James Morgan McGill, did, with premeditation, lure me to a soundstage in Albuquerque, dressed as a Lewis Carroll set, populated by actors in foam costumes, and did, while I was disoriented by the dressing, expose me to alternating current at load-bearing voltage with the intent to terminate me. Your Honour, I survived. I survived, and I walked here.");
        await addMessage(saul, "Chuck.");
        await addMessage(chuck, "I survived, Your Honour, by removing my shoes and running.");
        await addMessage(saul, "Chuck.");
        await addMessage(judge, "(slowly) Sir. You're saying. Your brother. Built a Lewis Carroll set. To electrocute you. With AC current.");
        await addMessage(chuck, "Yes, Your Honour.");
        await addMessage(judge, "In Albuquerque.");
        await addMessage(chuck, "Yes, Your Honour.");
        await addMessage(judge, "Where, in Albuquerque.");
        await addMessage(chuck, "I would have to consult my notes. The flamingo was very convincing, Your Honour. (beat) The flamingo had been trained.");
        await addMessage('Narrator', "A long silence.");
        await addMessage('Narrator', "The judge looks at Saul. Saul has the specific face of a man doing math. The math is: how badly does this damage my case? Saul, on reflection, decides: not at all, actually.");
        await addMessage(saul, "Your Honour, my brother has been unwell, Your Honour. He has these episodes. Specifically, he believes he is allergic to electricity, which I want to note for the record is not, in the medical literature, a recognised condition. He has been treating his condition with space blankets and gas lanterns and removing every wire from his home. He has, in the past, accused me of installing a baby monitor in his fireplace. It is a family thing. We are managing it, I would like the court to know I am managing it, with great compassion. You can put that in the record.");
        await addMessage(chuck, "I am NOT unwell. The AC current was.");
        await addMessage(judge, "Sir. Sir. I'm going to ask you one time. Are you a party to this case.");
        await addMessage(chuck, "I am a witness to a crime, Your Honour. The crime being attempted murder, by AC, in a fictional set. I have physical evidence. I have (produces a small charred fragment of fabric from his pocket) this.");
        await addMessage(judge, "What is that.");
        await addMessage(chuck, "It is part of the flamingo.");
        await addMessage(judge, "Bailiff.");
        await addMessage('Potted Plant', "(silence)");
        await addMessage(judge, "(massages his temples) …right. Right. I am adjourning these proceedings. Adjourned. I will reconvene this trial when I have had a very long lunch. Possibly two lunches. Counsels, juror, thank you. Mr. McGill, (to Chuck), I am going to ask you to leave my courtroom now, of your own volition, because if you do not, I will have to ask the bailiff, and the bailiff, as you may have noticed, is a plant.");
        await addMessage(chuck, "I am not finished. The flamingo was evidence.");
        await addMessage('Narrator', "The judge looks at the jury box. The judge looks at you.");
        await addMessage(judge, "Juror.");
        await addMessage('Player', "…yes?");
        await addMessage(judge, "You look like a sensible person. You look like a sensible person who has had a long day. I would like you to do me a favour.");
        await addMessage('Player', "Okay.");
        await addMessage(judge, "Please escort Mr. McGill out of my courtroom. And out of the building. And, ideally, into a cab. I don't care where the cab takes him. The cab is not my business. My business is that he is not in this building anymore. Are we clear.");
        await addMessage('Player', "Yes, Your Honour.");
        await addMessage(judge, "Good. And take the flamingo with you. Court is adjourned.");
        
        showChoices([{ text: "Watch them leave", nextScene: 'chapter3b_escort_start' }]);
    },
    chapter3b_escort_start: async () => {
        clearStory();
        await addMessage('Narrator', "He stands. He walks down off the bench, gathering his robe with a dignity that has been tested today. He exits through his private door. The door closes. The courtroom is, very suddenly, quiet.");
        await addMessage('Narrator', "Saul flees through the side door, briefcase under his arm, calling for cabs in the hallway. You hear him leave. You hear him keep leaving. He is, in the way of weather, gone.");
        await addMessage('Narrator', "You look at Chuck. Chuck is, at the back of the courtroom, holding the charred fabric up to the potted plant on the bailiff's chair, asking the potted plant to just look. The potted plant is not engaging.");
        await addMessage('Narrator', "You walk toward Chuck.");
        
        showChoices([{ text: "Escort Chuck", nextScene: 'chapter3b_escort_outside' }]);
    },
    chapter3b_escort_outside: async () => {
        clearStory();
        await addMessage('System', "Scene 5: The Escort");
        const chuck = "Chuck McGill";
        await addMessage('Player', "Mr. McGill. Sir. Mr. McGill.");
        await addMessage(chuck, "I am explaining to the bailiff.");
        await addMessage('Player', "Sir, the bailiff is a plant.");
        await addMessage(chuck, "It is a bailiff that has been replaced by a plant, which is, in itself, a violation.");
        await addMessage('Player', "(taking him gently by the elbow) Mr. McGill. The judge asked me to walk you out. We're going to walk out.");
        
        await addMessage('Narrator', "Chuck looks at your hand on his elbow. He looks at your face. He does not, in any meaningful sense, resist. He is too busy explaining things. He explains, as you walk down the courtroom aisle, that the voltage in the soundstage was 'load-bearing.' He explains that the colour red means something different in a Lewis Carroll set than it does in real life. He explains that the flamingo had eyes. Eyes that, on closer inspection, had been waiting. He explains that someone called the Hatter mentioned the date and the date was wrong, and that this is, technically, fraud. He explains that the air smelled like bergamot. He explains that bergamot is, and he wants the court to know this, not a legal smell.");
        await addMessage('Narrator', "You push through the courtroom doors into the marble hallway. You push through the lobby doors into the bright New Mexico sun.");
        await addMessage('Narrator', "Chuck stops talking.");
        await addMessage('Narrator', "He stops talking suddenly. He stops, in the middle of a sentence, in the way a record stops when the needle is lifted. He stands very still on the courthouse steps.");
        await addMessage('Narrator', "You, by reflex, also stop.");
        
        showChoices([{ text: "Ask him what's wrong", nextScene: 'chapter3b_vogon_reveal' }]);
    },
    chapter3b_vogon_reveal: async () => {
        clearStory();
        const chuck = "Chuck McGill";
        await addMessage('Player', "…Mr. McGill?");
        await addMessage(chuck, "Oh.");
        await addMessage('Player', "Oh what?");
        await addMessage('Narrator', "Chuck is looking up at the sky. You follow his gaze. The New Mexico sun is overhead, where a New Mexico sun should be.");
        await addMessage('Narrator', "The New Mexico sun is also, on closer inspection, not actually a sun. It is too low. It is too yellow. It is too, and this is the part that takes a moment to land, too rectangular.");
        await addMessage('Narrator', "Chuck's space blanket, in one final act of defiance, slides off his shoulders entirely. Chuck does not catch it. The blanket falls, with the slow dignity of a curtain at the end of a play, to the courthouse steps.");
        await addMessage('Narrator', "Underneath, Chuck's skin is doing something very subtle that, on closer inspection, is not subtle at all. There is too much of it. There are too many folds.");
        
        await addMessage(chuck, "…ah. Yes. Of course. We're back.");
        await addMessage('Player', "We're what?");
        await addMessage(chuck, "Don't be alarmed. I am Vogon. I have been Vogon the entire time. The McGill thing was a cover. It was deep cover. Jimmy doesn't know. Please don't tell Jimmy. The AC thing was, on reflection, a misunderstanding, I would like to note that, also, for the record, since you are, technically, still a juror. The ship is here. That is the ship. It has been waiting. Earth demolition is in, oh, twelve minutes. You should probably come with me.");
        
        await addMessage('Narrator', "The not-sun in the sky resolves into a vast, ugly, yellow vessel. It does not so much occupy the sky as ruin it. Cars on the street below pull over, one by one, drivers stepping out and looking up with the slow, patient resignation of people who have, frankly, suspected for a long time that something like this was coming.");
        await addMessage('Narrator', "A door opens in the underside of the ship. A man in a dressing gown leans out, holding two towels. He looks down. He sees Chuck. His face does something complicated.");
        
        const ford = "Ford Prefect";
        await addMessage(ford, "Charles? Oh, no. Not you again.");
        
        showChoices([{ text: "Step onto the ship", onClick: () => playScene('chapter4c_start') }]);
    }
});

// --- CHAPTER 3 EXTENSION ---
Object.assign(scenes, {
    chapter3_hallway: async () => {
        clearStory();
        changeVibe('chapter3', 'static/images/wonderland_bg.jpg');
        state.sympathy = 0; // Initialize sympathy meter

        await addMessage('Narrator', "You fall through the RV's bathroom door expecting a toilet, but instead, you get a hallway where things are immediately spiraling and loopy.");
        await addMessage('Narrator', "The hallway is looooooong, with a floor that gently breathes beneath your feet. The walls commit to a shade of purple before abruptly changing their minds to yellow. Somewhere far ahead, a clock ticks in 5/4 time, but as you count the beats, they constantly change how many of themselves there are.");
        await addMessage('Narrator', "You are still high. You are fully aware that you are still high, especially since the portraits keep changing whose face they feature whenever you are not looking directly at them. One of them, briefly, is of you holding a hot chocolate and looking deeply concerned.");
        await addMessage('Narrator', "At the end of the hallway sits a door with a brass handle, and that brass handle is currently making a small, embarrassed face.");
        await addMessage('System', "You open it, and lo.");

        showChoices([{ text: "Enter the door", nextScene: 'chapter3_court' }]);
    },
    chapter3_court: async () => {
        clearStory();
        await addMessage('Narrator', "You step into a courtroom that doubles as a garden, which, upon closer inspection, is actually a chessboard that somehow remains a courtroom. You decide to stop unpacking the architecture and look at the people instead.");
        await addMessage('Narrator', "A long table runs down the middle, covered in tea things in various states of distress and a cake that is being eaten by no one while somehow growing smaller by the second. At the head of the table sits a throne occupied by an enormous woman in red. This is the Queen, you reckon, mostly because she is holding a flamingo by the legs and using it to point at things. The flamingo looks incredibly tired. It has been pointed with for some time and has, you sense, recently begun looking into other career options.");
        await addMessage('Narrator', "The Queen draws breath, and everyone in the courtroom flinches preemptively.");

        const queen = "Queen of Hearts";
        await addMessage(queen, "OFF! WITH! HER! HEAD!");
        await addMessage('System', "The shout rattles your teeth as several teacups on the table tip over and immediately right themselves, looking embarrassed.");

        const hatter = "Mad Hatter";
        await addMessage(hatter, "(without looking at you) Oh. You're the one. Sit. Sit. Tea?");
        await addMessage('Narrator', "You sit, and he pours. The tea is the wrong temperature. As you sip, it becomes a completely different wrong temperature. It will never be the right temperature, you suspect, and the Hatter does not seem worried about this in the slightest.");

        const alice = "Alice";
        await addMessage(alice, "(quietly, to you) Please.");
        await addMessage('Narrator', "The Queen turns, bringing the flamingo with her.");
        await addMessage(queen, "YOU. New witness. State your business. Are you here to defend the accused? Are you here to condemn her? Are you here to ask for the bathroom? The bathroom is THAT WAY, and there are TEETH in it.");
        await addMessage('Narrator', "The Hatter mouths don't pick the bathroom at you, just in case you were considering it.");
        await addMessage(hatter, "(under his breath, fast) Listen to me. She's bluffing. She's got twelve soldiers, but half of them are diamonds and diamonds don't count in a fight. The Joker sold us out last Tuesday. You could take her. Or you could lawyer up. Don't ask, just pick fast.");

        showChoices([
            { text: "Launch a counter coup.", nextScene: 'chapter3_coup' },
            { text: "Hire a lawyer. You happen to know one.", nextScene: 'chapter3_lawyer' }
        ]);
    },
    chapter3_coup: async () => {
        clearStory();
        await addMessage('Narrator', "You stand up, drawing the eyes of the entire room, while the hedgehog in the dock sits up at attention.");
        const queen = "Queen of Hearts";
        await addMessage(queen, "YOU DARE!");
        await addMessage('Player', "Your Majesty. With respect. I move for a vote of no confidence.");
        await addMessage('Narrator', "The room goes dead quiet. The Queen's flamingo looks up at her, then at you, before settling into the universal pose of a professional who has decided not to take a position. The Hatter slides a teacup toward you across the table without looking. In the dock, Alice palms something small from the hedge and slips it into the cuff of your sleeve. You do not know what it is yet, and you do not have time to check.");
        await addMessage(queen, "A vote. A VOTE. In MY court. GUARDS.");
        await addMessage('Player', "Your Majesty, I'm calling witnesses.");
        await addMessage(queen, "WITNESSES?");
        await addMessage('Player', "Three of them.");
        await addMessage(queen, "(intrigued despite herself) ...three?");
        await addMessage('Player', "Three.");
        await addMessage('Narrator', "The Queen sits back as the flamingo, recognising the body language of a long afternoon ahead, exhales through its beak.");
        await addMessage(queen, "Fine. Call your witnesses. I will enjoy this so much, and when you fail, I will personally... <she snaps her fingers> ...demonstrate the technique to your friends. Set it up downstage where they can see it.");
        await addMessage('Narrator', "From a corridor somewhere offstage, the unmistakable sound of something heavy and wooden being wheeled along flagstone echoes into the room. Two playing cards struggle into view, pushing a tall, ominous, vertical apparatus draped in red velvet. The thing under the velvet is the exact size and shape of a small doorway with violent intentions.");
        const hatter = "Mad Hatter";
        await addMessage(hatter, "(low, to you) Don't look at it. Pick your witnesses and make them count. First impression's everything. Second impression's worse. Third one's the kill shot.");

        showSympathyMeter();
        showChoices([
            { text: "Begin the Trial", onClick: () => playScene('chapter3_trial_round1') }
        ]);
    },
    chapter3_trial_round1: async () => {
        clearStory();
        showChoices([
            { text: "The hedgehog. (He's been in the dock with Alice. He has seen things.)", onClick: () => { updateSympathy(2); playScene('chapter3_trial_r1_hedgehog'); } },
            { text: "The pocketwatch in your sleeve. (That's what Alice handed you. It's stopped.)", onClick: () => { updateSympathy(1); playScene('chapter3_trial_r1_pocketwatch'); } },
            { text: "The cake on the table. (It is being eaten by no one. It is also, somehow, smaller.)", onClick: () => { updateSympathy(0); playScene('chapter3_trial_r1_cake'); } }
        ]);
    },
    chapter3_trial_r1_hedgehog: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "The hedgehog rolls forward, climbing onto the witness stand without a single word. He fixes the Queen with a long, unblinking stare, and as the silence stretches past the point of comfort, the court slowly realizes that the staring is the testimony. The Queen looks away first.");
        await addMessage('System', "Sympathy: +2");
        setTimeout(() => playScene('chapter3_trial_round2_intro'), 3000);
    },
    chapter3_trial_r1_pocketwatch: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "You lay it on the table, and as it ticks once, the entire courtroom leans in. It does not tick again. The Hatter mutters that it has been broken since Tuesday and is purely a metaphor, sending an impressed murmur through the court.");
        await addMessage('System', "Sympathy: +1");
        setTimeout(() => playScene('chapter3_trial_round2_intro'), 3000);
    },
    chapter3_trial_r1_cake: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "The cake takes the stand without a word and simply gets smaller. The court is unsure if a crime has been committed or is currently being committed, prompting the Queen to roll her eyes.");
        await addMessage('System', "Sympathy: +0");
        setTimeout(() => playScene('chapter3_trial_round2_intro'), 3000);
    },
    chapter3_trial_round2_intro: async () => {
        clearStory();
        const queen = "Queen of Hearts";
        await addMessage(queen, "THIS IS A FARCE. I demand to call MY OWN witness. GUARDS! Bring me the MOST RELIABLE witness in the kingdom.");
        await addMessage('Narrator', "A guard steps forward. On closer inspection, the guard is a Two of Clubs.");
        const two = "Two of Clubs";
        await addMessage(two, "I don't actually remember anything that happened. Hello.");
        await addMessage(queen, "WHAT.");
        await addMessage(two, "I'm a two. Twos don't remember things. We mostly just stand.");
        await addMessage('Narrator', "The court titters.");
        await addMessage('System', "Sympathy: +1 (free)");
        updateSympathy(1);

        showChoices([
            { text: "Continue", onClick: () => playScene('chapter3_trial_round2') }
        ]);
    },
    chapter3_trial_round2: async () => {
        clearStory();
        showChoices([
            { text: "The Cheshire Cat. (Possibly already here. Hard to tell.)", onClick: () => { updateSympathy(3); playScene('chapter3_trial_r2_cat'); } },
            { text: "The March Hare. (He is on something. It is unclear what.)", onClick: () => { updateSympathy(1); playScene('chapter3_trial_r2_hare'); } },
            { text: "The Caterpillar. (Late forties. Smokes. Will not be hurried.)", onClick: () => { updateSympathy(2); playScene('chapter3_trial_r2_caterpillar'); } }
        ]);
    },
    chapter3_trial_r2_cat: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "A grin appears in mid air, three feet to the right of the witness stand, followed slowly and on its own schedule by the rest of a cat. Sitting on absolutely nothing, the grin announces that it sees most things and quotes the Queen admitting she only loves the shouting. The court erupts, and the Queen turns the exact colour of her own dress.");
        await addMessage('System', "Sympathy: +3");
        setTimeout(() => playScene('chapter3_trial_round3_intro'), 3000);
    },
    chapter3_trial_r2_hare: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "Hopping to the stand, the March Hare opens his mouth to speak before promptly forgetting his entire train of thought. After several seconds of profound, twitchy confusion, he points an accusatory finger at a nearby teapot that does, in fact, look incredibly guilty.");
        await addMessage('System', "Sympathy: +1");
        setTimeout(() => playScene('chapter3_trial_round3_intro'), 3000);
    },
    chapter3_trial_r2_caterpillar: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "Taking the stand at the literal speed of evolution, the Caterpillar surveys the court through his hookah. He waits until the silence has gone past comfortable, then past unbearable, then straight into art, before finally asking the Queen exactly who she is. Visibly, she does not have an answer.");
        await addMessage('System', "Sympathy: +2");
        setTimeout(() => playScene('chapter3_trial_round3_intro'), 3000);
    },
    chapter3_trial_round3_intro: async () => {
        clearStory();
        await addMessage('Narrator', "The Queen is sweating. Sensing the room shifting, the flamingo discreetly steps two paces away from her, which is a flamingo's quiet way of going on the record.");

        showChoices([
            { text: "Alice herself. (The accused. Risky. The Queen will scream.)", onClick: () => { updateSympathy(2); playScene('chapter3_trial_r3_alice'); } },
            { text: "The flamingo. (He's been waiting his whole career.)", onClick: () => { updateSympathy(3); playScene('chapter3_trial_r3_flamingo'); } },
            { text: "The Queen. (Call her as a witness. Against herself.)", onClick: () => { updateSympathy(4); playScene('chapter3_trial_r3_queen'); } }
        ]);
    },
    chapter3_trial_r3_alice: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "Alice stands and speaks without raising her voice at all. She simply explains that she came for a tea party, has been here for six hours, was told to change her size fifteen times, and would very much like to go home. The court goes dead quiet, leaving the Queen entirely speechless for the first time today.");
        await addMessage('System', "Sympathy: +2");
        setTimeout(() => playScene('chapter3_trial_resolution'), 3000);
    },
    chapter3_trial_r3_flamingo: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "You point at the Queen's flamingo, whose eyes widen as he frantically looks left and right. Over the Queen's wounded noise, the bird opens his beak and lets out a sound that has clearly been kept in for a lifetime, declaring he has been used as a mallet. The court leaps to its feet.");
        await addMessage('System', "Sympathy: +3");
        setTimeout(() => playScene('chapter3_trial_resolution'), 3000);
    },
    chapter3_trial_r3_queen: async () => {
        clearStory();
        clearInteractive();
        await addMessage('Narrator', "You call the Queen herself, causing her to sputter as the court demands her testimony. Cornered on the stand under the Hatter's gentle cross examination, she quietly admits she lacks the actual paperwork to be Queen and relies entirely on the shouting.");
        await addMessage('System', "Sympathy: +4");
        setTimeout(() => playScene('chapter3_trial_resolution'), 3000);
    },
    chapter3_trial_resolution: async () => {
        clearStory();
        hideSympathyMeter();
        if (state.sympathy >= 5) {
            playScene('chapter3_win');
        } else {
            playScene('chapter3_lose');
        }
    },
    chapter3_win: async () => {
        clearStory();
        await addMessage('Narrator', "The Queen is on her feet. She is no longer pretending to preside and is, frankly, having an episode.");
        const queen = "Queen of Hearts";
        await addMessage(queen, "ENOUGH. I have heard enough. I sentence THE WITNESS to... <she points at you, her hand shaking> ...OFF WITH HER HEAD!");
        await addMessage('Narrator', "She gestures wildly at the velvet draped apparatus. The court, now full throated, boos her.");
        await addMessage(queen, "HOW DARE YOU!!!");
        await addMessage('Narrator', "The court keeps booing. Cards stand up in defiance, the hedgehog rolls forward, and the Hatter raises a teacup like a revolutionary flag. Even the cake, which has been shrinking this entire time, manages to look indignant about it.");
        await addMessage('Narrator', "The Queen turns to her flamingo for support, but the bird is no longer by her side. On closer inspection, the flamingo is already at the lever. He looks at her, and after a lifetime of being pointed with, he finally points back by leveling one steady wing at the velvet.");
        await addMessage('Narrator', "The Two of Clubs pulls the velvet away. It is, of course, a guillotine.");
        await addMessage(queen, "...oh.");
        await addMessage('Narrator', "The Queen looks at the blade, looks at her court, and for one moment sets down her hands.");
        await addMessage(queen, "(quietly, to no one in particular) Alas. How unfortunate it be that I, the most wonderful Queen, be deposed in this manner. Have I ever suggested that you be eaten, dear Cake, in the bread's stead? Have I ever spilled tea regarding the teapot to anyone? May I die a Queen, rather than live any longer to see myself abdicate.");
        await addMessage('Narrator', "She straightens up, allowing her crown to correct itself sulkily.");
        await addMessage(queen, "Well. Get on with it.");
        await addMessage('Narrator', "The flamingo, who has waited many long afternoons for this exact moment, pulls the lever.");
        playSFX('static/audio/guillotine_chop.mp3');
        await addMessage('System', "The blade falls in a moment of perfect cartoon physics. The head pops off and rolls with great dignity three feet across the floor. The headless body rises and bows politely to the court, much like a guest leaving a dinner party at exactly the right time.");
        await addMessage('Narrator', "On the floor, the head blinks and opens its mouth.");
        await addMessage("Queen's Head", "OFF WITH... oh, bother.");
        await addMessage('Narrator', "The body casually picks up the head, tucks it under one arm, brushes itself off, and walks out of the courtroom with what can only be described as poise.");
        await addMessage('Narrator', "The Hatter is sobbing, Alice is laughing, and the hedgehog in the dock has entirely fainted from joy.");
        await addMessage('Narrator', "The ridiculous purple diamond and gold crown the Queen was wearing rolls across the flagstone and comes to a gentle stop at your foot. You bend down and pick it up. It is significantly heavier than it looks.");

        const alice = "Alice";
        const hatter = "Mad Hatter";
        await addMessage(alice, "(softly) Did we just depose her?");
        await addMessage('Player', "I think so.");
        await addMessage(alice, "What now?");
        await addMessage(hatter, "Hoorah for the peoples of wonderland! We are all now free! Free from the tyrannous Queen!");
        await addMessage('Player', "Well, I wouldn't say free exactly. More like under new management.");
        await addMessage('Narrator', "The characters exchange looks of cautious optimism and respectfully submit themselves to their new Queen! Hip hip hoorah!");

        showChoices([{ text: "13 rounds of rapid fire court cases later...", nextScene: 'chapter3_montage' }]);
    },
    chapter3_montage: async () => {
        clearStory();
        const cases = [
            { n: "A teapot accuses a teacup of plagiarism.", c1: "Both are sentenced to be filled with coffee.", c2: "Shatter the teacup for copyright infringement." },
            { n: "A very small cloud is sued for loitering over the croquet lawn.", c1: "Sentence it to rain immediately.", c2: "Evict it to the desert." },
            { n: "The Diamond playing cards file for unionization.", c1: "Off with their spades.", c2: "Grant them dental, but no vision." },
            { n: "The concept of 'Tuesday' is put on trial for feeling too long.", c1: "Tuesday is banished; we now have double Wednesday.", c2: "Cut Tuesday in half and feed it to the flamingo." },
            { n: "A mushroom claims it was stepped on by a careless child.", c1: "The child must be shrunk to 2 inches tall.", c2: "The mushroom is promoted to royal umbrella." },
            { n: "A shadow is accused of not matching its owner's movements.", c1: "The shadow is reassigned to the flamingo.", c2: "Arrest the owner for moving unpredictably." },
            { n: "Two halves of a sandwich dispute custody of the ham.", c1: "The ham is awarded to the jury.", c2: "Eat the sandwich yourself to settle it." },
            { n: "The color Orange sues the fruit Orange.", c1: "The fruit is legally renamed to 'Steve'.", c2: "Ban the color. Everything is now blue." },
            { n: "A clock is brought in for ticking out of rhythm (5/4 time).", c1: "Sentence it to digital.", c2: "Force it to tick backwards until it learns." },
            { n: "A puddle of water is charged with reflecting an unflattering portrait of you.", c1: "The puddle is mopped and imprisoned in a bucket.", c2: "The puddle is promoted to lead mirror." },
            { n: "A pair of shoes refuse to walk in the same direction.", c1: "Legal divorce.", c2: "Tie their laces together permanently." },
            { n: "A tree branch is arrested for dropping a leaf on the chessboard.", c1: "The branch is drafted as a new croquet mallet.", c2: "Arrest the leaf for trespassing." },
            { n: "The Mad Hatter sues himself for missing tea time.", c1: "Guilty. He must host a tea party immediately.", c2: "Innocent. The tea was late, not him." }
        ];

        let i = state.montageIndex || 0;
        if (i >= cases.length) {
            playScene('chapter3_mirror');
            return;
        }

        clearStory();
        await addMessage('Narrator', cases[i].n);
        
        const handleChoice = () => {
            playSFX('static/audio/gavel_bang.mp3');
            state.montageIndex = i + 1;
            clearInteractive();
            storyArea.classList.add('fade-out');
            setTimeout(() => playScene('chapter3_montage'), 2000);
        };
        
        showChoices([
            { text: `Verdict: ${cases[i].c1}`, onClick: handleChoice },
            { text: `Verdict: ${cases[i].c2}`, onClick: handleChoice }
        ]);
    },
    chapter3_mirror: async () => {
        clearStory();
        await addMessage('Player', "All this Queen stuff is getting kind of boring. Do we have a mirror on the wall here?");
        const mirror = "Mirror";
        await addMessage(mirror, "Right at your service, your Majesty.");
        await addMessage('Player', "Oh, good. Mirror dear, I want to embark on a new adventure as Queen.");
        await addMessage(mirror, "Oh. Adventure? But isn't there enough adventure here, m'lady?");
        await addMessage('Player', "I've reached the limits of the universe set by the...");
        await addMessage(mirror, "Oh yes, yes. Well, I have two options for you.");

        showChoices([
            { text: "You could adopt a pet dragon.", onClick: () => playScene('chapter3_dragon') },
            { text: "You could participate in gladiatorial games!", onClick: () => alert("Chapter 4A: The Hunger Games coming soon!") }
        ]);
    },
    chapter3_dragon: async () => {
        clearStory();
        await addMessage('Narrator', "You look up. The ceiling is gone, and the sky has vanished with it. In their place is an enormous, scaled, horned face peering down at you. It is visibly trying to figure out how to lift you without crushing you.");
        await addMessage('Narrator', "The dragon picks you up, gentle as a cat carrying a kitten, and climbs into the void.");
        await addMessage('Narrator', "The crown and gavel still in your hands.");
        showChoices([{ text: "Hold the crown and ascend", onClick: () => playScene('chapter4b_start') }]);
    },
    chapter3_lose: async () => {
        clearStory();
        await addMessage('Narrator', "The Queen rises. Against all the evidence of the last fifteen minutes, she is entirely steady. She has decided.");
        const queen = "Queen of Hearts";
        await addMessage(queen, "I have heard enough. You think this is mercy, calling these creatures, these witnesses, this absolute catalogue of the kingdom's disappointments?");
        await addMessage('Narrator', "She gestures at the velvet draped apparatus as the Two of Clubs starts to pull the cover off.");
        await addMessage(queen, "STOP. Don't show them yet. I've changed my mind. The guillotine is far too kind for this one.");
        await addMessage(queen, "I sentence you to a better arena.");
        await addMessage('Player', "What?");
        await addMessage(queen, "One with rules.");
        await addMessage('Player', "What?");
        await addMessage(queen, "Twenty three other children. One winner. Sponsors. Cameras. Don't worry, they'll explain on the way. GUARDS!");
        await addMessage('Narrator', "You are seized and rapidly moved. The room becomes a tunnel, which becomes a chute, which suddenly becomes open air and blistering hot light. Over the roar of a massive crowd, you feel sand under your feet and spot a cornucopia in the middle distance stacked with playing cards, teapots, and exactly one knife.");
        await addMessage('Narrator', "A young woman in dark braids appears beside you, already crouched and actively calculating your demise.");
        showChoices([{ text: "Proceed to Chapter 4A: The Hunger Games", onClick: () => alert("Chapter 4A coming soon!") }]);
    },
    chapter3_lawyer: async () => {
        clearStory();
        await addMessage('Player', "I'd like to invoke my right to counsel.");
        const queen = "Queen of Hearts";
        await addMessage(queen, "Your right to WHAT?!");
        await addMessage('Player', "I want a lawyer.");
        await addMessage('Narrator', "A small commotion breaks out at the back of the courtroom as a man pushes his way through the card soldiers. He is wearing a tailored three piece suit and is wrapped tightly in a medical grade space blanket for reasons not yet evident. He violently sneezes the exact moment he crosses the threshold and looks personally betrayed by the bodily function.");

        const chuck = "Chuck McGill";
        await addMessage(chuck, "I'll defend her. Charles McGill, attorney at law. Your Majesty. Your Honour. What is the title here, and what exactly do I call you? Is this a garden, or is the floor a garden? Oh, I sincerely hope you do not have any electricity in these...");
        await addMessage(queen, "APPROACH.");
        await addMessage('Narrator', "Chuck approaches as the flamingo eyes him with the distinct wariness of one professional clocking another.");
        await addMessage('Narrator', "Chuck pulls out a notepad and clicks his pen, but the pen refuses to click. He tries again, and the pen, deciding it has been clicked four times, unclicks itself in protest. Chuck stares at it, the pen meets his eyes, and Chuck ultimately loses the staring contest.");
        await addMessage(chuck, "Your Majesty. I would like to note for the record that today's date is...");
        await addMessage('Narrator', "He writes on the pad, frowns, and writes again. Frowning harder, he writes a third time, very slowly, sounding it out as he goes.");
        await addMessage(chuck, "1216. I am writing 1216. One after Magna Carta. I keep writing it, but the page is disagreeing with me.");
        await addMessage('Narrator', "He flips the notepad toward you. The page reads 1291. You blink. The page still reads 1291. You blink again, helpfully this time, and the page continues to read 1291, though it now features a small drawing of a cat next to the numbers. The cat winks at you. You deeply wish it hadn't.");

        showChoices([{ text: "Continue listening to Chuck", nextScene: 'chapter3_lawyer_rant' }]);
    },
    chapter3_lawyer_rant: async () => {
        clearStory();
        const chuck = "Chuck McGill";
        await addMessage('Narrator', "Chuck's breathing abruptly changes. He touches the side of his head as the confusion on his face hardens, crystallizing into sheer, furious self righteousness. He violently drops the pen.");
        await addMessage(chuck, "I am not crazy.");
        await addMessage('Narrator', "The courtroom goes dead silent.");
        playSFX('static/audio/electricity_buzz.mp3');
        await addMessage(chuck, "The laws of physics themselves are committing perjury! I know what this is because I felt it the second I walked in. The humming is not magic, and it is not whimsy! It is alternating current!");
        await addMessage('Narrator', "He spins around and points an accusatory, trembling finger at a cluster of glowing, floating flowers hovering above the table.");
        await addMessage(chuck, "Look at them! Do you think I am an idiot? I know an ungrounded circuit when I feel one! They are wired in parallel, emitting an unregulated electromagnetic field of at least two hundred kilovolts! My skin is boiling, and my internal organs are vibrating!");
        const queen = "Queen of Hearts";
        await addMessage(queen, "(delighted, leaning in) He's coming apart. I love it when they come apart. Do go on, lawyer.");
        await addMessage(chuck, "I AM NOT COMING APART! I am building a class action lawsuit! You think this is a legal proceeding? This chicanery?! Did Jimmy put you up to this? He did, did he not?! He orchestrated it! Jimmy! He hired you actors and wired this entire absurd set in parallel just to trigger my condition! He probably sold you the copper wire! Well, I am not falling for it! This entire dimension is a zoning violation with zero due process! There is no direct current conversion here at all. Not one single transformer! Do you know how many violations you are committing?");

        showChoices([{ text: "Brace for impact", nextScene: 'chapter3_lawyer_run' }]);
    },
    chapter3_lawyer_run: async () => {
        clearStory();
        const chuck = "Chuck McGill";
        const queen = "Queen of Hearts";
        await addMessage('Narrator', "Chuck turns his fury directly onto the Queen of Hearts, gripping his space blanket tight and shaking with pure litigious rage.");
        await addMessage(chuck, "You are no monarch. You are a glorified pumpkin actor in a cheap, flammable dress who was stupid enough to get conned by my brother! I am reporting this entire kingdom to the Bar Association!");
        await addMessage('Narrator', "The entire court gasps. The Hatter drops his teacup, and the flamingo quickly covers its eyes with a wing. The Queen stands up. The delight vanishes from her face, instantly replaced by a shade of purple that no wall in the hallway had managed to achieve.");
        await addMessage(queen, "A CHEAP DRESS?! GUARDS! OFF WITH HIS LITIGIOUS HEAD!");
        await addMessage('Narrator', "A half dozen card soldiers draw their halberds and charge the table. Chuck leaps back.");
        await addMessage(chuck, "Howard! HOWARD! I need a competent paralegal! We are filing an injunction against reality!");
        await addMessage('Narrator', "He turns and bolts. He runs in the exact way a man in a partly mutinous space blanket runs, which is not particularly fast, but is incredibly committed.");

        const alice = "Alice";
        await addMessage('Narrator', "You glance at Alice, who gives you a small, understanding nod. Go, the nod says. I'll be fine. I've done worse afternoons.");
        await addMessage('System', "You run after Chuck.");

        showChoices([{ text: "Escape the courtroom", nextScene: 'chapter3_meadow' }]);
    },
    chapter3_meadow: async () => {
        clearStory();
        await addMessage('Narrator', "You burst through the courtroom doors, smoothly dodging a thrown spear that was also somehow a Three of Spades. You crash through the courtroom doors behind the courtroom doors, tear through one final door that is just a hat someone has hung on a wall, and suddenly, you are outside.");
        await addMessage('Narrator', "Outside is a meadow. The meadow is remarkably unremarkable. It is so utterly unremarkable, especially after Wonderland, that it is bordering on rude.");

        const chuck = "Chuck McGill";
        await addMessage('Narrator', "Chuck is bent over a few feet away, resting his hands on his knees and breathing heavily.");
        await addMessage(chuck, "Okay. Okay. I am okay. I am better. The air is air. The zoning is agricultural. There is no alternating current here. Thank god. Thank... what is that?");
        await addMessage('Narrator', "You follow his gaze. In the sky above the meadow, right where the sun should be, there is something else entirely. It is definitely not a sun.");
        await addMessage('Narrator', "Chuck straightens up, and his eyes go very flat. He stops breathing like a man and starts breathing like a thing that does not, technically, need to breathe.");
        await addMessage(chuck, "...ah. Yes. Of course. We're back.");
        await addMessage('Player', "We're what?");
        await addMessage('Narrator', "Chuck's space blanket falls completely off his shoulders in one final act of defiance. Underneath, Chuck's skin is doing something very subtle that, upon closer inspection, is not subtle at all. There is simply too much of it, and there are far too many folds.");
        await addMessage(chuck, "Don't be alarmed. I am Vogon. I have been Vogon the entire time. The McGill thing was simply a cover. Jimmy doesn't know, so please don't tell Jimmy. The ship is here and it has been waiting. Earth demolition is scheduled in about twelve minutes, so you should probably come with me.");
        await addMessage('Narrator', "The object in the sky resolves into a vast, aggressively ugly yellow vessel. It does not so much occupy the sky as entirely ruin it.");
        await addMessage('Narrator', "A door opens in the ship's underside, and a man in a dressing gown leans out holding two towels. He looks down, sees Chuck, and his face does something incredibly complicated.");

        const ford = "Ford Prefect";
        await addMessage(ford, "Charles? Oh, no. Not you again.");

        showChoices([{ text: "Step onto the ship", onClick: () => playScene('chapter4c_start') }]);
    }
});

// --- CHAPTER 4C EXTENSION ---
Object.assign(scenes, {
    chapter4c_start: async () => {
        clearStory();
        changeVibe('chapter4_space', 'static/images/vogon_ship_bg.jpg');
        
        await addMessage('System', "Chapter 4C: Mostly Harmless");
        await addMessage('System', "Scene 1: The Ship");
        
        await addMessage('Narrator', "The light from the ship catches you. You feel, briefly, weightless. You feel, less briefly, several other things that you do not have the vocabulary for, including a sensation that may have been your skeleton being introduced to itself.");
        await addMessage('Narrator', "Then you are on the floor of a Vogon constructor ship.");
        await addMessage('Narrator', "The floor is grey. The walls are grey. The ceiling is, for variety, also grey, but a slightly different grey, the way office paint can be a slightly different white. There is no obvious source of light. There is no obvious source of air, either, though you appear to be breathing it.");
        
        const chuck = "Chuck McGill";
        await addMessage('Narrator', "Chuck is beside you on the floor. Chuck is no longer Chuck. Chuck is now, undeniably, a Vogon. Short, lumpy, faintly damp, with a face arranged the way a face would look if assembled from a catalogue of faces by someone who had not seen one in person. He is straightening his jacket, which is several sizes wrong on his new body.");
        await addMessage(chuck, "Apologies. The transport effect is unkind to humanoid skeletons. You will feel like yourself again in approximately four minutes. Or you will not. Either way, the worst is behind you.");
        
        const ford = "Ford Prefect";
        await addMessage('Narrator', "Ford Prefect is helping you to your feet. He is in his thirties, harried, in a dressing gown, holding a small leather-bound book with DON'T PANIC written on the cover in friendly capital letters.");
        await addMessage(ford, "Right. Towel. (produces a towel from somewhere, hands it to you) Hold this. Hold it tightly. The towel is, statistically, the most important thing about you for the next forty minutes. Do not lose the towel. Do not put down the towel. Do not, under any circumstances, lend the towel. (turns to Chuck) Charles.");
        await addMessage(chuck, "Ford.");
        await addMessage(ford, "You're doing the McGill bit again.");
        await addMessage(chuck, "I was embedded.");
        await addMessage(ford, "You were embedded in the eighteenth century.");
        await addMessage(chuck, "It went long.");
        await addMessage(ford, "Charles, you went native. You sneezed at a contract. I watched you on the long-range. You sneezed at a piece of paper.");
        await addMessage(chuck, "The paper had a date on it that disagreed with me.");
        await addMessage(ford, "(to you, gesturing at Chuck) Eight hundred years he's been on this assignment. Eight hundred years. He has forgotten which species he is on three separate occasions. The Vogon Bureaucratic Service is, I am sorry to say, what happens when you let a committee run an empire.");
        
        await addMessage('Narrator', "The floor of the ship shudders. A noise the colour of yellow and the texture of unwanted advice fills the room.");
        await addMessage(ford, "Right. That's the announcement. We have, I'm afraid, six minutes before the demolition begins. Which means we have five minutes before the poetry, which is worse. Come on.");
        await addMessage('Narrator', "He grabs you by the elbow that is not holding the towel. He drags you down a corridor.");
        
        showChoices([{ text: "Follow Ford", nextScene: 'chapter4c_processing' }]);
    },
    chapter4c_processing: async () => {
        clearStory();
        await addMessage('System', "Scene 2: The Bureaucracy");
        await addMessage('Narrator', "The corridor opens into a vast hall. The hall is full of desks. The desks are full of Vogons. The Vogons are full of forms. The forms are full of more forms.");
        
        const ford = "Ford Prefect";
        await addMessage(ford, "This is Processing. Every species being removed from a planet has to be processed. Forms in triplicate. Witness signatures. Receipts. The Vogons believe that if you are going to demolish a planet, the very least you can do is make the people on it fill out paperwork about it first. They consider this courtesy. It is, in their language, the same word as cruelty.");
        await addMessage('Player', "I'm not from this planet. I'm from, I think, several of them.");
        await addMessage(ford, "Yes. That makes you Form 27-B-Stroke-6. (produces a clipboard from inside his dressing gown) The Stroke 6 is the worst of all the strokes. (beat) I should warn you. This form has a particular philosophy. It will become clear. Or it will not. Either way, please complete it.");
        
        showChoices([{ text: "Take the clipboard", onClick: () => showVogonFormMinigame() }]);
    }
});

function showVogonFormMinigame() {
    clearInteractive();
    
    state.vogonFails = 0;
    let currentField = 1;
    let constantUnlocked = false;
    
    const container = document.createElement('div');
    container.className = 'vogon-form';
    
    const title = document.createElement('h3');
    title.innerText = "FORM 27-B-STROKE-6";
    container.appendChild(title);
    
    const formArea = document.createElement('div');
    container.appendChild(formArea);
    
    const messagesDiv = document.createElement('div');
    messagesDiv.style.marginBottom = '15px';
    messagesDiv.style.fontWeight = 'bold';
    container.appendChild(messagesDiv);
    
    interactiveArea.appendChild(container);
    
    const fields = [
        {
            num: 1,
            label: "SPECIES OF ORIGIN",
            check: (val) => {
                if (val === '42') return { stamp: true, msg: "Designation recognized. Proceed." };
                const v = val.toLowerCase();
                if (v.includes('human') || v.includes('earthling')) return { stamp: false, msg: "Too squishy. The form requires your numerical cosmic designation." };
                return { stamp: false, msg: "Unregistered biological anomaly. Please quantify." };
            }
        },
        {
            num: 2,
            label: "PLANET OF ORIGIN",
            check: (val) => {
                if (val === '42') return { stamp: true, msg: "" };
                if (val.toLowerCase().includes('earth')) return { stamp: false, msg: "Earth is a soil type, not a coordinate. The bureau requires standard existential metrics." };
                return { stamp: false, msg: "Unrecognized localized slang." };
            }
        },
        {
            num: 3,
            label: "PRIMARY PURPOSE OF EXISTENCE (SUMMARISED)",
            check: (val) => {
                if (val === '42') return { stamp: true, msg: "" };
                return { stamp: false, msg: "Prose is highly inefficient. The form requires a definitive, quantifiable absolute." };
            }
        },
        {
            num: 4,
            label: "EMERGENCY CONTACT (MUST NOT BE RELATED BY BLOOD, MARRIAGE, OR MUTUAL UNDERSTANDING)",
            check: (val) => {
                if (val === '42') return { stamp: true, msg: "" };
                return { stamp: false, msg: "The form cannot verify this individual's lack of understanding of you. Provide the universal constant." };
            }
        },
        {
            num: 5,
            label: "PLEASE DESCRIBE YOUR FEELINGS REGARDING YOUR IMMINENT DEMOLITION",
            check: (val) => {
                if (val === '42') return { stamp: true, msg: "" };
                return { stamp: false, msg: "Emotional variables cannot be processed on a Tuesday. Please express your terror as an integer." };
            }
        },
        {
            num: 6,
            label: "ARE YOU CARRYING A TOWEL",
            check: (val) => {
                if (val === '42') return { stamp: true, msg: "" };
                const v = val.toLowerCase();
                if (v === 'yes' || v === 'no') return { stamp: false, msg: "Binary responses are for lesser forms. Form 27-B-Stroke-6 demands the Ultimate Answer." };
                return { stamp: false, msg: "Binary responses are for lesser forms. Form 27-B-Stroke-6 demands the Ultimate Answer." };
            }
        },
        {
            num: 7,
            label: "PREFERRED CONTINENT FOR EVACUATION (ASSUMING PLANET REMAINS INTACT, WHICH IT WON'T)",
            check: (val) => {
                if (val === '42') return { stamp: true, msg: "" };
                return { stamp: false, msg: "Geography is irrelevant in a vacuum. You know what to do." };
            }
        }
    ];

    function renderField() {
        formArea.innerHTML = '';
        if (currentField > 7) {
            finishForm();
            return;
        }
        
        const f = fields[currentField - 1];
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'vogon-field';
        
        const label = document.createElement('label');
        label.className = 'vogon-label';
        label.innerText = `FIELD ${f.num}. ${f.label}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'vogon-input';
        
        const btn = document.createElement('button');
        btn.className = 'submit-btn';
        btn.style.marginTop = '10px';
        btn.innerText = "Submit Field";
        
        btn.onclick = async () => {
            const val = input.value.trim();
            const result = f.check(val);
            
            if (result.stamp) {
                messagesDiv.innerHTML = `<span class="vogon-stamp">ACCEPTED</span>`;
                if (result.msg) messagesDiv.innerHTML += `<br><span style="color:#88aa88; font-size:0.9rem;">${result.msg}</span>`;
                
                state.vogonFails = 0;
                currentField++;
                
                if (currentField === 4 && !constantUnlocked) {
                    constantUnlocked = true;
                    await addMessage('Form', "The form detects an administrative pattern. The form strongly approves of patterns. They require far less reading. All subsequent fields will accept the constant.");
                }
                
                setTimeout(renderField, 1000);
            } else {
                state.vogonFails++;
                messagesDiv.innerHTML = `<span style="color:#ff4444; font-weight:bold;">REJECTED</span><br><span class="vogon-error">${result.msg}</span>`;
                
                if (state.vogonFails >= 5) {
                    input.disabled = true;
                    btn.disabled = true;
                    await addMessage('Ford Prefect', "(leaning over your shoulder) Look. I'm not supposed to help. The form is meant to be filled out unaided, it's a dignity thing. But they are literally warming up the destructor beams outside and you are arguing with a piece of paper. You're thinking too literally. Vogons don't care about the truth, they care about the Ultimate truth. Deep Thought? The mice? Ring any bells? No? (He sighs, rubbing his temples.) The integer between forty-one and forty-three? Just type it. Type it for everything. It's the only number their rudimentary filing system accepts as profound.");
                    input.value = "42";
                    input.disabled = false;
                    btn.disabled = false;
                }
            }
        };
        
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        fieldDiv.appendChild(btn);
        formArea.appendChild(fieldDiv);
        input.focus();
    }
    
    async function finishForm() {
        clearInteractive();
        await addMessage('Narrator', "The form, on the seventh stamp, produces a small paper boarding pass that says simply GUEST. It then sticks out a tongue you did not know it had and licks the boarding pass shut.");
        const ford = "Ford Prefect";
        await addMessage(ford, "Marvellous. Hold onto that. They will, at some point, ask to see it. They will then, after seeing it, ask to see it again. Pretend the second time is the first time.");
        playScene('chapter4c_poetry');
    }

    renderField();
}

Object.assign(scenes, {
    chapter4c_poetry: async () => {
        clearStory();
        const ford = "Ford Prefect";
        const chuck = "Chuck McGill";
        await addMessage('Narrator', "A loudspeaker, somewhere, clears its throat. The throat-clearing is also yellow.");
        await addMessage('Loudspeaker', "And now, in observance of the Standard Demolition Protocols, the Captain of this Constructor Ship will read three poems of his own composition.");
        await addMessage('Narrator', "Ford goes pale. Ford goes paler than pale, the way a man goes when he has heard the same words before and is, against his better judgment, alive.");
        await addMessage(ford, "No. No no no no. Charles. Charles. I asked you. I specifically asked you. You said you would handle the captain.");
        await addMessage(chuck, "I have been on this ship for twelve minutes.");
        await addMessage(ford, "Charles.");
        await addMessage(chuck, "I have just changed bodies, Ford.");
        await addMessage(ford, "CHARLES.");
        await addMessage('Narrator', "The loudspeaker begins to read. The poetry is the third-worst poetry in the universe. It will not be transcribed here, for legal reasons, and also because the third-worst poetry in the universe has been known to stop pacemakers.");
        await addMessage(ford, "(in your ear) Hold the towel. Hold the towel. Cover your ears with the towel. The towel is sometimes also a sound-dampener. Do not ask me how. It just is.");
        await addMessage('Narrator', "You hold the towel over your ears. The poetry continues, muffled, the way bad news is muffled by a closed door, which is to say, not enough.");
        await addMessage('Narrator', "It ends. Eventually. You think.");
        
        showChoices([{ text: "Lower the towel", nextScene: 'chapter4c_tea_lady' }]);
    },
    chapter4c_tea_lady: async () => {
        clearStory();
        await addMessage('System', "Scene 3: The Tea Lady");
        await addMessage('Narrator', "A door opens at the end of the hall. A woman in a tabard pushes through with a small trolley. The trolley contains a teapot, several cups, a small plate of biscuits, and what appears to be a single shortbread. The shortbread has been waiting.");
        
        const teaLady = "Tea Lady";
        const ford = "Ford Prefect";
        await addMessage(teaLady, "Tea?");
        await addMessage(ford, "(immediately) Yes. Yes. Please. Tea is the only response to poetry. This is a known law.");
        await addMessage('Narrator', "She pours. The tea is the wrong temperature in the way only tea on a Vogon ship is the wrong temperature. The tea has been brewed, briefly, in someone's grief.");
        await addMessage('Narrator', "You drink it. It is, against all expectation, exactly what you needed.");
        
        await addMessage(teaLady, "(to you) First demolition?");
        await addMessage('Player', "I think so.");
        await addMessage(teaLady, "Hardest one. They get easier. (small, sad smile) They never get easy. They just get familiar.");
        await addMessage('Narrator', "She pats you on the shoulder. The pat is the most Vogon thing in the room, in that it is the least Vogon thing in the room, and the contradiction tells you everything you need to know about her.");
        await addMessage('Narrator', "She moves on. The trolley wheels squeak, in a key that suggests they have squeaked across many demolitions.");
        
        showChoices([{ text: "Watch the viewports", nextScene: 'chapter4c_earth_briefly' }]);
    },
    chapter4c_earth_briefly: async () => {
        clearStory();
        await addMessage('System', "Scene 4: Earth, Briefly");
        await addMessage('Narrator', "The Vogon ship shudders. The viewports, in the next chamber over, go very, very bright. You do not look. Ford does not look. Chuck, on principle, does not look. Vogons, in general, do not look. Vogons consider this kindness. In Vogon, the word is the same as cowardice.");
        await addMessage('Narrator', "The brightness fades.");
        await addMessage('Narrator', "Where Earth was, on the long-range, is now, very specifically, not there. What is there instead is, by every measure, less, in a way that does not, from this distance, look very different from more.");
        await addMessage('Narrator', "You think, also briefly, of a kitchen you have not yet been in. There is a smell, around your shoulders, that wasn't there a moment ago. The smell is hot chocolate.");
        
        const ford = "Ford Prefect";
        await addMessage('Narrator', "Ford notices. Ford is, you have begun to suspect, a man who notices many small things while pretending to notice none of them.");
        await addMessage(ford, "Ah.");
        await addMessage('Player', "Ah?");
        await addMessage(ford, "(reaching into his dressing-gown pocket and producing a thin slip of paper that has not, you are reasonably sure, been there before) Recall note. Hand-delivered. Smells of, ah, hot chocolate.");
        await addMessage('Player', "What does it say.");
        await addMessage(ford, "(reading) Please return your traveller. She has an appointment. (beat) Nice handwriting. (turns the paper over) Ah. Signed the Interviewer. I know the man. Or, I know of the man. He runs a project. Out of a small office. Off the main spine of the universe. He, ah, facilitates people. (folds the note, hands it to you) This is yours. The smell will fade. The paper will not.");
        await addMessage('Narrator', "You take the note. The paper is warm, the way paper is warm if it has been pressed, recently, against the inside of a coat pocket of someone who has just made a very good drink.");
        
        showChoices([{ text: "Leave the Ship", nextScene: 'chapter4c_departure' }]);
    },
    chapter4c_departure: async () => {
        clearStory();
        await addMessage('System', "Scene 5: The Departure");
        await addMessage('Narrator', "A door at the back of the chamber, which had not previously been there, opens by itself.");
        await addMessage('Narrator', "Behind it is a long, oak-panelled hallway.");
        await addMessage('Narrator', "You recognise it. You have, somehow, walked it once before, in the other direction, before any of this began. The floor of the hallway is breathing. A clock somewhere is ticking in 5/4. The smell of hot chocolate is, very gently, coming from inside.");
        
        const ford = "Ford Prefect";
        const chuck = "Chuck McGill";
        
        await addMessage(ford, "(quietly) Right. That'll be your stop. (takes the towel back from you, with regret) I'll need this. I'm sorry. The towel is, ah, issued.");
        await addMessage('Player', "It's okay.");
        await addMessage(ford, "Take care of yourself, traveller.");
        await addMessage(chuck, "(from the floor, where he is now sitting, contemplating his hands as a Vogon contemplates anything) Tell Jimmy I'm sorry. About the. (gestures vaguely) All of it.");
        await addMessage('Player', "I will.");
        await addMessage(chuck, "And, ah. The AC current business. I would like the record to reflect that I do not, in fact, believe my brother attempted to electrocute me. The cover got, I am willing to admit, too deep.");
        await addMessage(ford, "Charles.");
        await addMessage(chuck, "Yes, Ford.");
        await addMessage(ford, "You are still doing the McGill bit.");
        await addMessage(chuck, "(slowly, looking at his hands) Oh. Oh, am I.");
        
        await addMessage('Narrator', "You step toward the hallway. You step through.");
        await addMessage('Narrator', "The Vogon ship door, behind you, swings shut with the soft, certain click of a chapter ending.");
        
        showChoices([{ text: "Step into the hallway", onClick: () => playScene('tap_discharge') }]);
    }
});

// --- CHAPTER 4B EXTENSION ---
Object.assign(scenes, {
    chapter4b_start: async () => {
        clearStory();
        changeVibe('chapter4b_dragon', 'static/images/dragon_flight_bg.jpg');
        
        await addMessage('System', "Chapter 4B: The Talons of Peace");
        await addMessage('System', "Scene 1: Up");
        
        await addMessage('Narrator', "The dragon picks you up. The dragon picks you up gently. The gentleness is, you note, the gentleness of an animal that has had to learn its own strength after breaking many things. It places you on top of itself.");
        await addMessage('Narrator', "The Wonderland courtroom drops away beneath you. The Hatter, on the table, becomes a small bright dot. The hedgehog, in the dock, becomes a smaller dot. The Queen's body, with the head tucked under its arm, becomes a very small dot, walking with great composure off-stage.");
        await addMessage('Narrator', "You are in the air. Your hand is still, you note, holding the crown.");
        
        const starflight = "Starflight";
        await addMessage('Dragon', "(in a voice that is, somehow, in your head, and also somehow in your spine) Hold on. The wind up here is enthusiastic.");
        await addMessage('Narrator', "The dragon banks. You hold on. The wind is, indeed, enthusiastic.");
        await addMessage(starflight, "I have come a great way to find you. You are, by every reckoning of the Talons, late.");
        await addMessage('Player', "I'm sorry.");
        await addMessage(starflight, "It's not your fault. The world is, frequently, late. We make allowances.");
        await addMessage('Narrator', "The dragon climbs. The clouds rush past. You think, briefly, that this is the part of every dream where you fall, and then you do not fall, and you understand that this is, in some sense, not a dream.");
        
        await addMessage('Player', "What's your name?");
        await addMessage(starflight, "Starflight. I am the secondary escort. The Talons have primary escorts and secondary escorts. The primary escort is, today, unavailable.");
        await addMessage('Player', "Why?");
        await addMessage(starflight, "She is moulting. Dragons of her tribe moult every fourteen years. The moult is, by tradition, a private affair. We do not, as a matter of policy, discuss the moult.");
        await addMessage('Narrator', "You decide, on reflection, not to ask about the moult.");
        
        showChoices([{ text: "Look ahead", nextScene: 'chapter4b_mountain' }]);
    },
    chapter4b_mountain: async () => {
        clearStory();
        await addMessage('System', "Scene 2: The Mountain");
        await addMessage('Narrator', "The dragon descends, eventually, onto the flat top of a mountain. The flat top of the mountain is paved, you realise as you land, with scales the size of dinner plates, fitted together like a mosaic. The scales are every colour.");
        
        const starflight = "Starflight";
        await addMessage(starflight, "Welcome to the Talons of Peace.");
        await addMessage('Narrator', "He pauses by a small cluster of amber scales near your foot.");
        await addMessage(starflight, "(quietly) These were Glory's grandmother's. She liked amber. The current Glory likes a slightly different amber. We are, on the mountain, deeply attentive to the difference.");
        
        const tsunami = "Tsunami";
        await addMessage('Narrator', "A small dragon, no taller than your shoulder, is sitting near the edge of the platform, reading a book. The book is enormous. The dragon is turning the pages with what appears to be the back of one wing.");
        await addMessage(tsunami, "(without looking up) Hi! Sorry. One second. Just finishing a chapter. (turns a page) OK. (closes the book) Hi! I'm Tsunami. You're the visitor. We've been expecting you. The Council is thrilled.");
        await addMessage('Player', "The Council?");
        await addMessage(tsunami, "The Council of Talons. The Talons of Peace. We are, in technical terms, a pacifist faction with teeth. In literal terms, we are eight dragons in a cave who keep the world from ending more often than it does. Come on. Council's running late. (rolls eyes) Council's always running late. Sunny has opinions.");
        
        await addMessage('Narrator', "She gestures with the book. The book, you note, has read me first written on the spine in dragon-handwriting, which is to say, in scratch marks the size of your forearm.");
        
        showChoices([{ text: "Follow her inside", nextScene: 'chapter4b_cave' }]);
    },
    chapter4b_cave: async () => {
        clearStory();
        await addMessage('System', "Scene 3: The Cave");
        await addMessage('Narrator', "The cave is enormous. The cave is warmer than the air outside. The cave is, you realise, lit from within, by a soft, friendly light that emanates from crystals in the ceiling. The crystals are in clusters. The clusters are, on close inspection, arranged in constellations of dragons whose names you do not know.");
        await addMessage('Narrator', "Five dragons are seated in a rough circle around a low stone table. Four of them have wings folded. One has wings half-extended.");
        
        const sunny = "Sunny";
        const clay = "Clay";
        const tsunami = "Tsunami";
        const glory = "Glory";
        
        await addMessage(sunny, "(the half-extended one, small, gold) And that is why I think we should not, for the third time, ratify the same treaty we already ratified twice.");
        await addMessage(clay, "(a large, brown dragon, soft-eyed) Sunny. We agreed.");
        await addMessage(sunny, "We agreed to agree. We did not do the agreeing. (notices you) Oh! Oh, hi. Hi! Sorry. Sit. Sit, sit, sit. Tea?");
        await addMessage('Player', "Yes, please.");
        
        await addMessage('Narrator', "A kettle is, from somewhere, brought. The kettle is, you note, the size of a human bathtub. The kettle pours into a cup that is, in turn, the size of a human soup bowl. The cup has been, you sense, kept aside, for visitors who have hands that do not work the way dragon hands work.");
        await addMessage('Narrator', "The tea is the correct temperature. You sit. You drink.");
        
        await addMessage(tsunami, "(taking her seat) Right. Quorum. Where's Glory?");
        await addMessage('Narrator', "A fifth dragon, who has been seated in a deeper shadow in the back of the cave, unfurls. She is sand-coloured in this light, but as she steps forward into the crystal-light, her scales shift, with the deliberate slowness of an animal that has complete control over them, into deep amber.");
        await addMessage(glory, "Apologies. I was reading.");
        await addMessage(tsunami, "Glory, this is the visitor. Visitor, this is Glory. Queen of the RainWings. Co-chair of this Council on alternating moons. Reluctant dragon.");
        await addMessage(glory, "(to you, levelly) Hello.");
        await addMessage('Player', "Hello.");
        await addMessage(glory, "(small, very dry smile) I am told there is, in another realm, a version of me that recently lost her head in a Wonderland courtroom. I would like the record to reflect that I am the original. The Wonderland one was, I am told, theatrical. I am, in my own life, not.");
        await addMessage(tsunami, "She is, in fact, theatrical. She just doesn't want it on the record.");
        await addMessage(glory, "Tsunami.");
        await addMessage(tsunami, "I'm not wrong.");
        await addMessage('Narrator', "She settles. Her wings fold.");
        
        showChoices([{ text: "Show them the crown", nextScene: 'chapter4b_crown' }]);
    },
    chapter4b_crown: async () => {
        clearStory();
        await addMessage('System', "Scene 4: The Crown");
        
        const tsunami = "Tsunami";
        const clay = "Clay";
        const sunny = "Sunny";
        const glory = "Glory";
        
        await addMessage(tsunami, "So. (small smile) You brought us something.");
        await addMessage('Player', "I did? Oh, the crown!");
        await addMessage('Narrator', "You set the crown on the stone table. The crown is, against the scale of the table, small.");
        await addMessage('Narrator', "The five dragons look at the crown. The five dragons look at each other. The five dragons look at you.");
        await addMessage(clay, "Where did you get that.");
        await addMessage('Player', "From the Queen of Hearts. I uh, overthrew her.");
        await addMessage(clay, "Overthrew her?");
        await addMessage('Player', "Mostly. I called for a no confidence trial and executed her. Hehe, sorry.");
        
        await addMessage('Narrator', "A long silence.");
        await addMessage(sunny, "(slowly) That is exactly how every legitimate transfer of sovereignty in recorded dragon history has begun.");
        await addMessage(tsunami, "Exactly.");
        await addMessage(clay, "Exactly.");
        await addMessage(glory, "(after a beat, evenly) It is, on this point, traditional for visitors to deny the crown sought them. To ask the Council, very politely, to take it from them, and carry on. That is the traditional script.");
        await addMessage(glory, "Is that the script you would like to follow?");
        
        const showCrownChoices = () => {
            showChoices([
                { 
                    text: "Yes. Take it.", 
                    onClick: async () => {
                        clearInteractive();
                        await addMessage('Glory', "Are you crazy??");
                        setTimeout(showCrownChoices, 1000);
                    }
                },
                { 
                    text: "I'll keep carrying it.", 
                    onClick: async () => {
                        clearInteractive();
                        await addMessage('Glory', "Seriously? What’s the point of a crown if you’re not the Queen?");
                        setTimeout(showCrownChoices, 1000);
                    }
                },
                { text: "I want to be queen.", nextScene: 'chapter4b_coronation' }
            ]);
        };
        
        showCrownChoices();
    },
    chapter4b_coronation: async () => {
        clearStory();
        const tsunami = "Tsunami";
        const clay = "Clay";
        const sunny = "Sunny";
        const glory = "Glory";
        
        await addMessage('Narrator', "The Council is silent for a long moment.");
        await addMessage('Narrator', "The crystals in the ceiling, very subtly, change colour. Not enough that you can be sure. Just enough that the light in the cave is, for the next few seconds, different.");
        
        await addMessage(tsunami, "(quietly) Oh.");
        await addMessage(sunny, "(very, very quietly, after a long beat) Glory.");
        await addMessage(glory, "(her amber, in this light, deepening one shade) Yes.");
        await addMessage(sunny, "Is it. Is this.");
        await addMessage(glory, "I think so.");
        await addMessage(tsunami, "Wait. Wait, hold on. Hold on. Is this the prophecy.");
        await addMessage(sunny, "(reaching for a scroll that has been on her side of the table the entire conversation, which you have not noticed before, which she now unrolls with fingers that are visibly shaking) I think it is the prophecy.");
        await addMessage(clay, "Sunny.");
        await addMessage(sunny, "I think it is the prophecy, Clay.");
        
        await addMessage('Narrator', "She unrolls the scroll. The scroll is enormous unrolled. The scroll is, you realise, the scroll. The scroll the council keeps. The scroll the council, presumably, exists to keep.");
        await addMessage('Narrator', "She reads, in a voice that is, for the first time since you arrived, not the voice of a dragon making notes.");
        await addMessage(sunny, "When the queens of war have ruled too long, And the song of the dragon-world is wrong, A traveller bearing a borrowed crown will walk a mountain, and lay it down. She will seek the throne. She will not flee. She will choose, of her own will, to be. And the war that the world has carried so long will end on the day she begins to reign.");
        
        await addMessage('Narrator', "A long silence.");
        await addMessage('Narrator', "You are, you realise, holding the crown.");
        await addMessage('Narrator', "You set it on your head.");
        await addMessage('Narrator', "The crown, on contact with you, settles, with the small, pleased weight of an object that has, after several long days, arrived where it was going.");
        await addMessage('Narrator', "The crystals in the ceiling, more visibly now, shift. Amber. Then deeper amber. Then purple. The whole cave is, for one held second, purple.");
        
        await addMessage(glory, "(rising) Then we will, on this council, crown you.");
        await addMessage('Narrator', "The other four rise with her.");
        await addMessage(glory, "(formally) By the Council of Talons, by the witness of the four, by the consent of the queen of the RainWings, by the prophecy of the keeper of the prophecy, we name you Queen. Of Wonderland. Of the Talons. Of the dragon-realms by extension and treaty. The mountain Jade will hold, from this hour, seventy-three new scales of your favourite colour, in your honour, for so long as the mountain stands.");
        
        await addMessage(sunny, "(quietly, to Clay) We just repaved.");
        await addMessage(clay, "(quietly) Sunny.");
        await addMessage(sunny, "I'm just saying.");
        await addMessage(tsunami, "(to you, smiling) Congratulations, Your Majesty.");
        
        await addMessage('Narrator', "You sit, again. The crown stays. The cave is, from this moment, very gently, purple.");
        
        showChoices([{ text: "Issue your decrees", onClick: () => showDecreesMinigame() }]);
    },
    chapter4b_lifeboat: async () => {
        clearStory();
        await addMessage('System', "Scene 6: The Lifeboat");
        await addMessage('Narrator', "The chains arrive. Seven dragons are led into the cave, in chains. The chains are long. The chains are, in fact, each connected to the others, in the way of prisoners who have been moved together in case any one of them tried to run. They are, at this moment, furious, frightened, or carefully composed, in proportions that vary across the seven.");
        await addMessage('Narrator', "The Council steps back.");
        
        const glory = "Glory";
        const sunny = "Sunny";
        const tsunami = "Tsunami";
        
        await addMessage(glory, "(quietly, to you, very seriously) It is your court. We will witness. We will not interrupt. There are, however, rules.");
        await addMessage('Player', "Rules?");
        await addMessage(glory, "Mercy is finite. The continent has, at this hour, the capacity to absorb four acts of mercy without collapsing. Seven prisoners. Four mercies. That is the math. The other three cannot be spared. They go to the guillotine. That is what the decree means.");
        await addMessage(sunny, "It is, on the mountain, called the Lifeboat. When the ship is lost, you do not get to save everyone. You decide who goes in the boat. You decide who stays in the water. You decide honestly, and the world remembers what you decide.");
        await addMessage(tsunami, "The Council will not advise. The Council will not interrupt. The Council witnesses.");
        
        await addMessage('Narrator', "She steps back, with the others. You are, very suddenly, alone at the centre of the cave, with the crown on your head, seven of the most consequential dragons in the recent history of the continent in chains in front of you, and four mercies to allocate.");
        
        showChoices([{ text: "Listen to the prisoners", onClick: () => showLifeboatMinigame() }]);
    },
    chapter4b_door: async () => {
        clearStory();
        await addMessage('System', "Scene 8: The Door");
        await addMessage('Narrator', "A door at the back of the cave, which you had not previously seen, opens. From beyond the door comes a long, oak-panelled hallway. The same hallway. You recognise it. You have walked it once before, in the other direction. The floor is breathing. A clock somewhere is ticking in 5/4. The smell of hot chocolate is, very gently, coming from inside.");
        
        const glory = "Glory";
        const tsunami = "Tsunami";
        const sunny = "Sunny";
        const clay = "Clay";
        
        await addMessage(glory, "(rising) By tradition. By every tradition. A monarch in absentia leaves the crown with the council that crowned her. Wonderland and the Talons will hold the throne for you. We will, in your name, rule kindly. You will return when you can.");
        await addMessage('Narrator', "You take the crown off. You set it, carefully, on the stone table where it had rested before the trial. The crown, set down, closes its eyes, if crowns can be said to do that. You decide, for argument's sake, that they can.");
        
        await addMessage(tsunami, "(softly) Take care of yourself, Your Majesty.");
        await addMessage(sunny, "And of her. And of yourself.");
        await addMessage(clay, "And eat something on the way. You look thin.");
        await addMessage(tsunami, "(handing you, with the back of one wing, a small wrapped parcel) Dragon-bread. It keeps. (small smile) You'll know when. (adds a second, smaller parcel) And fruit. For her. Mostly mango. She has strong feelings about mango.");
        
        await addMessage('Narrator', "You step toward the hallway. The hallway, around you, is exactly as you remembered it. The crown, behind you, on the stone table, waits. Glory the Small, on your shoulder, has settled in for what is, by her own estimation, the journey. The cave behind you is, in its centre, very purple.");
        await addMessage('Narrator', "The cave entrance, behind you, swings shut with the soft, certain click of a chapter ending.");
        
        showChoices([{ text: "Walk the hallway", onClick: () => playScene('tap_discharge') }]);
    },
    tap_discharge: async () => {
        clearStory();
        document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
        
        await addMessage('Narrator', "You walk the hallway. The hallway is shorter than it was the first time. You have read this somewhere. You cannot remember where.");
        await addMessage('Narrator', "A door opens. Behind it is the office: oak desk, green lamp, a window with a Sunday afternoon sky, two mugs of hot chocolate on the desk, the Interviewer in his cardigan, looking up.");
        
        const intv = "Interviewer";
        await addMessage(intv, "Welcome back.");
        await addMessage('Player', "Thank you.");
        await addMessage(intv, "(small smile) Drink the hot chocolate. It has been waiting.");
        await addMessage('Narrator', "You sit. You drink. The hot chocolate is exactly the right temperature.");
        await addMessage(intv, "I will not keep you long. The Project, on discharge, gives every traveller one small thing to take with them. A letter, if you'll have it. From us. (slides an envelope across the desk) Read it when you're ready. Not before. Not after. Then.");
        
        await addMessage('Narrator', "You take the envelope. The envelope is purple, with yellow trim. Your name, in copperplate, is on the front.");
        await addMessage(intv, "(rising, walking you to the door) Be thirty-something well. The Project will be here, if you need it. (at the door, more quietly) It has been, today, very glad to know you.");
        await addMessage('Narrator', "He opens the door. On the other side is not the hallway. On the other side is the card.");
        
        showChoices([{ text: "Step through the door", onClick: () => showFinalCard() }]);
    }
});

// --- DECREES MINIGAME ---
function showDecreesMinigame() {
    clearStory();
    clearInteractive();
    
    const container = document.createElement('div');
    container.className = 'decree-container';
    
    const title = document.createElement('h3');
    title.innerText = "Scene 5: The Decrees";
    title.style.color = 'var(--accent)';
    container.appendChild(title);
    
    const intro = document.createElement('p');
    intro.innerText = `Glory: "By tradition. By every tradition. A new monarch, on coronation, issues three decrees. The first is symbolic. The second is consequential. The third is whatever the new monarch wishes. The Council will, on each decree, react. That is also tradition."`;
    intro.style.fontStyle = 'italic';
    container.appendChild(intro);
    
    const setup = document.createElement('p');
    setup.innerText = `A scroll is brought. A quill is brought. The quill is the size of your forearm. Tsunami, anticipating, produces a smaller quill from somewhere and slides it across the table.\nTsunami: "We keep human-sized quills. For visitors. I know, it's charming. Don't tell Glory. Don't tell either Glory."`;
    container.appendChild(setup);
    
    const decreesForm = document.createElement('div');
    
    // Decree 1
    const d1 = document.createElement('div');
    d1.innerHTML = `<div class="decree-title">DECREE 1: THE ROYAL PALETTE</div>
        <div class="decree-text">"The royal palette of Wonderland and the Talons shall, from this moment, be 
        <select id="d1-sel" class="decree-select">
            <option value="Red">Red</option>
            <option value="Black">Black</option>
            <option value="Pink">Pink</option>
            <option value="Purple" selected>Purple</option>
            <option value="Whatever Glory Is Wearing">Whatever Glory Is Wearing</option>
            <option value="A Specific Sunset I Once Saw">A Specific Sunset I Once Saw</option>
        </select>."</div><br>`;
    decreesForm.appendChild(d1);
    
    // Decree 2
    const d2 = document.createElement('div');
    d2.innerHTML = `<div class="decree-title">DECREE 2: THE GUILLOTINE</div>
        <div class="decree-text">"The guillotine, formerly used for the previous queen's enemies, shall now be used for 
        <select id="d2-sel" class="decree-select">
            <option value="cake">cake</option>
            <option value="loud speakers">loud speakers</option>
            <option value="people who say 'with respect'">people who say 'with respect'</option>
            <option value="the architects of the dragon-war" selected>the architects of the dragon-war</option>
            <option value="nothing">nothing</option>
            <option value="nothing for one hundred years">nothing for one hundred years</option>
            <option value="the same purpose it was used for">the same purpose it was used for</option>
        </select>."</div><br>`;
    decreesForm.appendChild(d2);
    
    // Decree 3
    const d3 = document.createElement('div');
    d3.innerHTML = `<div class="decree-title">DECREE 3: ONE OTHER THING</div>
        <div class="decree-text">"Furthermore, the Queen decrees that 
        <select id="d3-sel" class="decree-select">
            <option value="hedgehogs shall be respected at all times">hedgehogs shall be respected at all times</option>
            <option value="flamingos shall be paid">flamingos shall be paid</option>
            <option value="Tuesdays shall be optional">Tuesdays shall be optional</option>
            <option value="no person shall be called for jury duty without consent">no person shall be called for jury duty without consent</option>
            <option value="the Hatter is hereby knighted">the Hatter is hereby knighted</option>
        </select>."</div><br>`;
    decreesForm.appendChild(d3);
    
    const btn = document.createElement('button');
    btn.className = 'submit-btn';
    btn.innerText = "Seal the Decrees";
    
    btn.onclick = async () => {
        btn.disabled = true;
        const color = document.getElementById('d1-sel').value;
        const guillotine = document.getElementById('d2-sel').value;
        const other = document.getElementById('d3-sel').value;
        
        clearInteractive();
        
        const tsunami = "Tsunami";
        const glory = "Glory";
        const sunny = "Sunny";
        
        // Read 1
        await addMessage(tsunami, `(reading) Hereby and forthwith, the royal palette of Wonderland and the Talons shall, from this moment, be ${color.toLowerCase()}.`);
        await addMessage('Mountain Jade', "(somewhere off-screen, in a deep, rumbling groan) Already?");
        await addMessage(sunny, "She is new. Be patient with her.");
        await addMessage(glory, "(very dryly) It suits her.");
        await addMessage('Narrator', "The amber scales in the floor, near your foot, shift, slowly, to " + color.toLowerCase() + ". Then the next ring. Then the next. The cave, in slow concentric circles, becomes yours.");
        
        // Read 2
        if (guillotine === "the architects of the dragon-war" || guillotine === "the same purpose it was used for") {
            await addMessage(tsunami, `(reading, voice drops, formal now) Hereby and forthwith, the guillotine of Wonderland, formerly used for the previous queen's enemies, shall now be used for ${guillotine}: the three SandWing sister-queens, and the inner circle who built and sustained their war for twenty years. To be brought before the Queen herself. To be tried. To be allocated mercy as the Queen sees fit.`);
            await addMessage('Narrator', "The cave goes very quiet.");
            await addMessage(glory, "(very still) Repeat that.");
            await addMessage(tsunami, "She has summoned the whole circle, Glory. To be tried. All seven.");
            await addMessage(glory, "(after a long beat, very softly) Then we are, on this council, witnessing the most peaceful opening act of any monarchy in recorded dragon history. I would like the record to reflect that.");
            await addMessage('Clay', "We will need more chains.");
            await addMessage(sunny, "We have plenty of chains. We have been preparing.");
            await addMessage('Narrator', "A wing-gesture from Glory. Somewhere, very far away, a bell rings. Then another. Then, in the deep underbelly of the mountain, the slow, ceremonial clink-and-drag of seven sets of chains beginning a very long walk.");
        } else {
            await addMessage(tsunami, `(reading) Hereby and forthwith, the guillotine of Wonderland... shall now be used for ${guillotine}.`);
            await addMessage(glory, "A bold choice.");
        }
        
        // Read 3
        await addMessage(tsunami, `(reading) Furthermore, the Queen decrees that ${other}.`);
        await addMessage('Narrator', "The decrees are sealed. The scroll is rolled.");
        
        if (guillotine === "the architects of the dragon-war" || guillotine === "the same purpose it was used for") {
            showChoices([{ text: "Await the prisoners", nextScene: 'chapter4b_lifeboat' }]);
        } else {
            showChoices([{ text: "Leave the mountain", nextScene: 'chapter4b_door' }]);
        }
    };
    
    container.appendChild(decreesForm);
    container.appendChild(btn);
    interactiveArea.appendChild(container);
}

// --- LIFEBOAT MINIGAME ---
const lifeboatPrisoners = [
    { id: 'burn', name: 'Burn', quote: "I am the eldest. The throne is, by SandWing tradition, mine. I have killed only in war. I have not, ever, lied. I am, of the seven of us, the most predictable. Predictability, in a queen, is peace.", options: ["REIGN CLEANLY (rules SandWings)", "EXILE (banished beyond realms)", "RETIRE TO A FORTRESS (contained)"] },
    { id: 'blister', name: 'Blister', quote: "I am the only one of the three of us who can hold a coalition... Spare me, advisor or queen, and I deliver you a united continent in six months.", options: ["ROYAL ADVISOR (informants everywhere)", "EXILE (builds smaller web)", "SENT TO COURT (supervised)"] },
    { id: 'blaze', name: 'Blaze', quote: "I was eight when the war started. Eight. My sisters told me what to do. I was a little sister who did what she was told. Spare me. I just want to go home.", options: ["SEND HOME (parties)", "EXILE (very dull)", "RETIRE TO RAINFOREST (monitored)"] },
    { id: 'smolder', name: 'Smolder', quote: "I did nothing. I want the record to reflect that. I did not cheer the war. I did not oppose the war... That is the case for the defence.", options: ["REIGN AS REGENT (quiet king)", "RETIRE QUIETLY (books)", "EXILE (never asked for this)"] },
    { id: 'morrowseer', name: 'Morrowseer', quote: "I wrote the prophecies that justified this war. I am aware of this... I will write you a prophecy that binds the continent to peace for the next century.", options: ["COURT PROPHET (peace)", "EXILE (strange decade)", "RETIRE TO MONASTERY (meditation)"] },
    { id: 'vermilion', name: 'Vermilion', quote: "Your Majesty, I am a bureaucrat. I never killed a dragon... If your court wishes to charge me with the crime of bookkeeping, I will accept that charge.", options: ["COURT REGISTRAR (good paperwork)", "EXILE (records returned slowly)", "TESTIFY AGAINST OTHERS (retires)"] },
    { id: 'battlewinner', name: 'Battlewinner', quote: "I funded the war from a cave. I have not left the cave in forty years. If your court wishes to sentence me to exile, I am, frankly, already in exile.", options: ["STAY IN HER CAVE (dies eventually)", "RELEASE TO COMMUNITY HOME (recovers)", "FORMAL EXILE (moved to smaller cave)"] }
];

function showLifeboatMinigame() {
    clearInteractive();
    
    let selectedToSpare = new Set();
    
    const container = document.createElement('div');
    container.style.width = '100%';
    
    const title = document.createElement('div');
    title.className = 'lifeboat-status';
    title.innerText = "ALLOCATE YOUR MERCY: Select 4 to Spare (3 go to guillotine)";
    container.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'lifeboat-grid';
    
    const cards = {};
    const btns = {};
    
    lifeboatPrisoners.forEach(p => {
        const card = document.createElement('div');
        card.className = 'prisoner-card';
        
        const name = document.createElement('div');
        name.className = 'prisoner-name';
        name.innerText = p.name;
        
        const quote = document.createElement('div');
        quote.className = 'prisoner-quote';
        quote.innerText = `"${p.quote}"`;
        
        const btn = document.createElement('button');
        btn.className = 'submit-btn';
        btn.style.width = '100%';
        btn.innerText = "Spare";
        
        const fateSelect = document.createElement('select');
        fateSelect.className = 'prisoner-fate-select';
        fateSelect.style.display = 'none';
        p.options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.innerText = opt;
            fateSelect.appendChild(o);
        });
        
        btn.onclick = () => {
            if (selectedToSpare.has(p.id)) {
                selectedToSpare.delete(p.id);
                btn.innerText = "Spare";
                btn.style.background = 'var(--btn-bg)';
                fateSelect.style.display = 'none';
            } else {
                if (selectedToSpare.size < 4) {
                    selectedToSpare.add(p.id);
                    btn.innerText = "SPARED";
                    btn.style.background = '#88aa88';
                    fateSelect.style.display = 'block';
                }
            }
            updateStatus();
        };
        
        cards[p.id] = card;
        btns[p.id] = btn;
        
        card.appendChild(name);
        card.appendChild(quote);
        card.appendChild(btn);
        card.appendChild(fateSelect);
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'submit-btn';
    confirmBtn.innerText = "Seal Fates";
    confirmBtn.disabled = true;
    confirmBtn.onclick = async () => {
        clearInteractive();
        const unpicked = lifeboatPrisoners.filter(p => !selectedToSpare.has(p.id));
        
        await addMessage('Narrator', "You make your four picks. The three unpicked (" + unpicked.map(u=>u.name).join(', ') + ") are led, one by one, off-stage. Three muffled drops, in sequence. The cave is silent for each.");
        await addMessage('Narrator', "For the four spared prisoners, you deliver their fates. The cave map shifts: regions go iron-grey or open or watched or quiet, the continent reshapes in front of you, in real time, in the floor.");
        await addMessage('Narrator', "After the last pick, the chains are silent. The cave is still. The map on the floor has, by now, completely reshaped: dragon-world is, by your choices, a different continent than it was when you walked in.");
        
        const glory = "Glory";
        const sunny = "Sunny";
        const tsunami = "Tsunami";
        
        await addMessage(glory, "(very softly, after a long pause) It is done. The war is over.");
        await addMessage(sunny, "(reading from the prophecy scroll, very softly) And the war that the world has carried so long Will end on the day she rights the song.");
        await addMessage(tsunami, "(after a long beat) Your Majesty. (beat) You decided honestly. The world will remember.");
        await addMessage('Narrator', "You take a long breath. The crown on your head is, somehow, lighter than it was.");
        
        showChoices([{ text: "Stand up", onClick: () => playScene('chapter4b_door') }]);
    };
    container.appendChild(confirmBtn);
    
    interactiveArea.appendChild(container);
    
    function updateStatus() {
        title.innerText = `ALLOCATE YOUR MERCY: Selected ${selectedToSpare.size}/4`;
        if (selectedToSpare.size === 4) {
            confirmBtn.disabled = false;
            title.style.color = '#88aa88';
        } else {
            confirmBtn.disabled = true;
            title.style.color = '#a1d6e2';
        }
    }
}

// --- THE FINAL CARD ---
function showFinalCard() {
    clearStory();
    document.body.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #1a0033 0%, #2d1b4e 50%, #1a0033 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Cinzel', 'Georgia', serif;
        opacity: 0;
        transition: opacity 1s;
        z-index: 9999;
    `;
    
    const envelope = document.createElement('div');
    envelope.style.cssText = `
        position: relative;
        width: 500px;
        height: 320px;
        background: linear-gradient(135deg, #6b46c1 0%, #9333ea 100%);
        border-radius: 8px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        cursor: pointer;
        transition: all 0.8s ease;
    `;
    
    const flapTop = document.createElement('div');
    flapTop.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        border-left: 250px solid transparent;
        border-right: 250px solid transparent;
        border-top: 160px solid #8b5cf6;
        transform-origin: top center;
        transition: transform 1.2s ease;
        z-index: 3;
    `;
    
    const envelopeText = document.createElement('div');
    envelopeText.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #f3e8ff;
        font-size: 28px;
        font-weight: 300;
        letter-spacing: 2px;
        text-align: center;
        z-index: 2;
        transition: opacity 0.5s;
        font-family: 'Cinzel', 'Georgia', serif;
    `;
    envelopeText.innerHTML = `To ${playerName}<br><span style="font-size:16px; opacity:0.8; letter-spacing:1px;">Click to open</span>`;
    
    const letter = document.createElement('div');
    letter.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.7);
        width: 700px;
        max-width: 90vw;
        max-height: 85vh;
        background: #fefcf8;
        border-radius: 8px;
        padding: 60px 50px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        opacity: 0;
        transition: all 1s ease;
        z-index: 10;
        overflow-y: auto;
        cursor: default;
        pointer-events: none;
    `;
    
    const letterContent = document.createElement('div');
    letterContent.style.cssText = `
        color: #2d1b4e;
        line-height: 1.9;
        font-size: 18px;
        font-family: 'Cinzel', 'Georgia', serif;
    `;
    
    const lines = [
        { text: `Dear Pockie,`, style: 'margin-bottom: 25px; font-size: 22px; font-weight: 600;' },
        { text: 'Happy 18th Birthday!!!', style: 'margin-bottom: 20px; font-weight: 600; font-size: 20px;' },
        { text: "You’re now an adult!!! How does it feel? Birthdays from now only get harder, but I hope you have a blast this year!", style: 'margin-bottom: 18px;' },
        { text: "I find myself looking back and I too am amazed by how fast the time has gone.", style: 'margin-bottom: 18px;' },
        { text: "I hope you know how much of a wonderful person you are, and reflect on the journey you’ve taken to reach here.", style: 'margin-bottom: 18px;' },
        { text: "I wish you all the very best today and in the many years to come!", style: 'margin-bottom: 18px;' },
        { text: 'Happy birthday.', style: 'margin-bottom: 15px;' },
        { text: 'XCalibur/Abhinav', style: 'font-style: italic; color: #6b46c1; font-size: 19px;' }
    ];
    
    lines.forEach(line => {
        const p = document.createElement('p');
        p.style.cssText = `opacity: 0; transition: opacity 1.2s; ${line.style}`;
        p.innerText = line.text;
        letterContent.appendChild(p);
    });
    
    letter.appendChild(letterContent);
    envelope.appendChild(flapTop);
    envelope.appendChild(envelopeText);
    container.appendChild(envelope);
    container.appendChild(letter);
    document.body.appendChild(container);
    
    setTimeout(() => { container.style.opacity = '1'; }, 100);
    
    let opened = false;
    let pulled = false;
    
    envelope.addEventListener('click', () => {
        if (!opened) {
            opened = true;
            flapTop.style.transform = 'rotateX(180deg)';
            envelopeText.style.opacity = '0';
            
            setTimeout(() => {
                envelope.style.opacity = '0';
                envelope.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    letter.style.opacity = '1';
                    letter.style.transform = 'translate(-50%, -50%) scale(1)';
                    letter.style.pointerEvents = 'auto';
                    pulled = true;
                    
                    const paragraphs = letterContent.querySelectorAll('p');
                    paragraphs.forEach((p, idx) => {
                        setTimeout(() => {
                            p.style.opacity = '1';
                        }, 500 + (idx * 400));
                    });
                    
                    setTimeout(() => {
                        const closeBtn = document.createElement('button');
                        closeBtn.style.cssText = `
                            display: block;
                            margin: 30px auto 0;
                            padding: 14px 40px;
                            background: linear-gradient(135deg, #6b46c1 0%, #9333ea 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 16px;
                            font-family: 'Cinzel', 'Georgia', serif;
                            cursor: pointer;
                            opacity: 0;
                            transition: all 0.3s;
                            box-shadow: 0 4px 15px rgba(107, 70, 193, 0.4);
                        `;
                        closeBtn.innerText = 'Close Session';
                        closeBtn.onmouseover = () => {
                            closeBtn.style.transform = 'translateY(-2px)';
                            closeBtn.style.boxShadow = '0 6px 20px rgba(107, 70, 193, 0.6)';
                        };
                        closeBtn.onmouseout = () => {
                            closeBtn.style.transform = 'translateY(0)';
                            closeBtn.style.boxShadow = '0 4px 15px rgba(107, 70, 193, 0.4)';
                        };
                        closeBtn.onclick = () => {
                            container.style.opacity = '0';
                            setTimeout(() => {
                                document.body.innerHTML = `
                                    <div style="
                                        background: #0a0a0a;
                                        color: #4ade80;
                                        height: 100vh;
                                        display: flex;
                                        flex-direction: column;
                                        justify-content: center;
                                        align-items: center;
                                        font-family: 'Courier New', monospace;
                                        font-size: 20px;
                                        letter-spacing: 1px;
                                    ">
                                        <div style="margin-bottom: 20px; font-size: 24px;">? SESSION COMPLETE</div>
                                        <div style="opacity: 0.7;">THE AMELIA PROJECT</div>
                                        <div style="opacity: 0.5; margin-top: 10px; font-size: 14px;">Connection terminated successfully</div>
                                    </div>
                                `;
                            }, 1000);
                        };
                        letterContent.appendChild(closeBtn);
                        setTimeout(() => { closeBtn.style.opacity = '1'; }, 500);
                    }, 500 + (lines.length * 400) + 500);
                }, 800);
            }, 600);
        }
    });
}
function showSympathyMeter() {
    let meter = document.getElementById('sympathy-meter-container');
    if (!meter) {
        meter = document.createElement('div');
        meter.id = 'sympathy-meter-container';
        meter.className = 'sympathy-meter';

        const fill = document.createElement('div');
        fill.id = 'sympathy-fill';
        fill.className = 'sympathy-fill';
        fill.style.width = '0%';

        const text = document.createElement('div');
        text.id = 'sympathy-text';
        text.className = 'sympathy-text';
        text.innerText = 'Courtroom Sympathy: 0 / 9';

        meter.appendChild(fill);
        meter.appendChild(text);

        const gameContainer = document.getElementById('game-container');
        const interactiveArea = document.getElementById('interactive-area');
        gameContainer.insertBefore(meter, interactiveArea);
    }
    meter.style.display = 'block';
}

function hideSympathyMeter() {
    const meter = document.getElementById('sympathy-meter-container');
    if (meter) meter.style.display = 'none';
}

function updateSympathy(points) {
    state.sympathy = (state.sympathy || 0) + points;
    const maxSympathy = 9;
    const pct = Math.min((state.sympathy / maxSympathy) * 100, 100);

    const fill = document.getElementById('sympathy-fill');
    const text = document.getElementById('sympathy-text');

    if (fill) fill.style.width = pct + '%';
    if (text) text.innerText = `Courtroom Sympathy: ${state.sympathy} / ${maxSympathy}`;
}


