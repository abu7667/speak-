let button = document.querySelector('#speakBtn')
let input = document.querySelector('#textInput')
let select = document.querySelector('#voiceSelect')
let pitchSlider = document.querySelector('#pitch')
let rateSlider = document.querySelector('#rate')
let volumeSlider = document.querySelector('#volume')
let pitchValue = document.querySelector('#pitchValue')
let rateValue = document.querySelector('#rateValue')
let volumeValue = document.querySelector('#volumeValue')
let stopButton = document.querySelector('#stopBtn')
let pauseButton = document.querySelector('#pauseBtn')
let progressBar = document.querySelector('#progressBar')
let charCount = document.querySelector('#charCount')
let themeToggle = document.querySelector('#themeToggle')
let saveBtn = document.querySelector('#saveBtn')
let historyList = document.querySelector('#historyList')
let clearHistoryBtn = document.querySelector('#clearHistory')
let visualizer = document.querySelector('#visualizer')
let downloadBtn = document.querySelector('#downloadBtn')
let repeatBtn = document.querySelector('#repeatBtn')
let randomBtn = document.querySelector('#randomBtn')
let emojiBtn = document.querySelector('#emojiBtn')
let emojiPicker = document.querySelector('#emojiPicker')
let wordCount = document.querySelector('#wordCount')
let timeEstimate = document.querySelector('#timeEstimate')
let favoriteBtn = document.querySelector('#favoriteBtn')
let favoritesList = document.querySelector('#favoritesList')

let voices = []
let isPaused = false
let isRepeating = false
let history = JSON.parse(localStorage.getItem('speechHistory')) || []
let favorites = JSON.parse(localStorage.getItem('speechFavorites')) || []
let currentSpeech = null
let visualizerInterval = null

// Emoji список
const emojis = ['😀', '😂', '🥰', '😎', '🤔', '👍', '❤️', '🔥', '⭐', '🎉', '🎵', '🌟', '💡', '🚀', '✨', '🎨', '📚', '☕', '🌈', '🦄']

// Загрузка при старте
loadHistory()
loadFavorites()
updateStats()

button.addEventListener('click', () => {
    if (window.speechSynthesis.speaking && !isPaused) {
        window.speechSynthesis.cancel()
    }
    
    if (!input.value.trim()) {
        showToast('Iltimos, matn kiriting!', 'error')
        shakeElement(input)
        return
    }
    
    speakText(input.value)
    saveToHistory(input.value)
})

function speakText(text) {
    currentSpeech = new SpeechSynthesisUtterance(text)
    currentSpeech.lang = 'uz-UZ'
    
    const selectedVoice = voices.find(voice => voice.name === select.value)
    if (selectedVoice) {
        currentSpeech.voice = selectedVoice
    }
    
    currentSpeech.pitch = parseFloat(pitchSlider.value)
    currentSpeech.rate = parseFloat(rateSlider.value)
    currentSpeech.volume = parseFloat(volumeSlider.value)

    let startTime = Date.now()
    let words = text.split(' ')
    let currentWord = 0
    
    currentSpeech.onboundary = (event) => {
        if (event.name === 'word') {
            currentWord++
            highlightProgress(currentWord, words.length)
        }
    }

    currentSpeech.onstart = () => {
        button.disabled = true
        stopButton.disabled = false
        pauseButton.disabled = false
        downloadBtn.disabled = false
        progressBar.style.width = '0%'
        startVisualizer()
        animateProgress(currentSpeech)
    }

    currentSpeech.onend = () => {
        button.disabled = false
        stopButton.disabled = true
        pauseButton.disabled = true
        progressBar.style.width = '100%'
        stopVisualizer()
        
        setTimeout(() => {
            progressBar.style.width = '0%'
        }, 500)
        
        isPaused = false
        pauseButton.innerHTML = '⏸️'
        
        // Повтор если активен
        if (isRepeating) {
            setTimeout(() => {
                speakText(text)
            }, 1000)
        }
    }

    currentSpeech.onerror = () => {
        showToast('Xatolik yuz berdi!', 'error')
        button.disabled = false
        stopButton.disabled = true
        pauseButton.disabled = true
        stopVisualizer()
    }

    window.speechSynthesis.speak(currentSpeech)
}

function animateProgress(speech) {
    let interval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
            clearInterval(interval)
            return
        }
        
        let currentWidth = parseFloat(progressBar.style.width) || 0
        if (currentWidth < 95) {
            progressBar.style.width = (currentWidth + 1) + '%'
        }
    }, 100)
}

function highlightProgress(current, total) {
    const percentage = (current / total) * 100
    progressBar.style.width = percentage + '%'
}

stopButton.addEventListener('click', () => {
    window.speechSynthesis.cancel()
    button.disabled = false
    stopButton.disabled = true
    pauseButton.disabled = true
    downloadBtn.disabled = true
    progressBar.style.width = '0%'
    isPaused = false
    pauseButton.innerHTML = '⏸️'
    stopVisualizer()
})

pauseButton.addEventListener('click', () => {
    if (isPaused) {
        window.speechSynthesis.resume()
        pauseButton.innerHTML = '⏸️'
        isPaused = false
        startVisualizer()
    } else {
        window.speechSynthesis.pause()
        pauseButton.innerHTML = '▶️'
        isPaused = true
        stopVisualizer()
    }
})

// Повтор
repeatBtn.addEventListener('click', () => {
    isRepeating = !isRepeating
    repeatBtn.classList.toggle('btn-active')
    if (isRepeating) {
        showToast('Takrorlash yoqildi 🔁', 'success')
        repeatBtn.innerHTML = '🔁'
    } else {
        showToast('Takrorlash o\'chirildi', 'info')
        repeatBtn.innerHTML = '↻'
    }
})

// Случайный голос
randomBtn.addEventListener('click', () => {
    if (voices.length > 0) {
        const randomVoice = voices[Math.floor(Math.random() * voices.length)]
        select.value = randomVoice.name
        showToast(`Tasodifiy ovoz: ${randomVoice.name}`, 'info')
        
        // Случайные параметры
        pitchSlider.value = (Math.random() * 1.5 + 0.5).toFixed(1)
        pitchValue.textContent = pitchSlider.value
        
        rateSlider.value = (Math.random() * 1.5 + 0.5).toFixed(1)
        rateValue.textContent = rateSlider.value
    }
})

// Emoji picker
emojiBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden')
})

emojis.forEach(emoji => {
    const btn = document.createElement('button')
    btn.className = 'btn btn-ghost btn-sm text-2xl hover:scale-125 transition-transform'
    btn.textContent = emoji
    btn.onclick = () => {
        input.value += emoji
        updateStats()
        emojiPicker.classList.add('hidden')
    }
    emojiPicker.appendChild(btn)
})

// Закрытие emoji picker при клике вне его
document.addEventListener('click', (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
        emojiPicker.classList.add('hidden')
    }
})

// Обновление слайдеров
pitchSlider.addEventListener('input', (e) => {
    pitchValue.textContent = e.target.value
})

rateSlider.addEventListener('input', (e) => {
    rateValue.textContent = e.target.value
})

volumeSlider.addEventListener('input', (e) => {
    volumeValue.textContent = e.target.value
})

// Статистика текста
input.addEventListener('input', () => {
    updateStats()
})

function updateStats() {
    const text = input.value
    const chars = text.length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const estimatedTime = Math.ceil((words / 150) * 60) // 150 слов в минуту
    
    charCount.textContent = chars
    wordCount.textContent = words
    timeEstimate.textContent = estimatedTime > 0 ? `~${estimatedTime}s` : '0s'
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices()
    console.log(voices)
    
    select.innerHTML = '<option value="">Ovozni tanlang</option>'
    
    // Группировка голосов по языкам
    const languageGroups = {}
    voices.forEach(voice => {
        const lang = voice.lang.split('-')[0]
        if (!languageGroups[lang]) {
            languageGroups[lang] = []
        }
        languageGroups[lang].push(voice)
    })
    
    // Добавление голосов по группам
    Object.keys(languageGroups).sort().forEach(lang => {
        const optgroup = document.createElement('optgroup')
        optgroup.label = `${lang.toUpperCase()} (${languageGroups[lang].length})`
        
        languageGroups[lang].forEach(voice => {
            let option = document.createElement('option')
            option.value = voice.name
            option.innerText = `${voice.name}`
            optgroup.appendChild(option)
            
            if (voice.lang.includes('uz') || voice.lang.includes('ru')) {
                option.selected = true
            }
        })
        
        select.appendChild(optgroup)
    })
}

window.speechSynthesis.onvoiceschanged = loadVoices
loadVoices()

// Быстрые фразы
document.querySelectorAll('.quick-phrase').forEach(btn => {
    btn.addEventListener('click', (e) => {
        input.value = e.target.dataset.phrase
        updateStats()
    })
})

// Смена темы
themeToggle.addEventListener('click', () => {
    const html = document.documentElement
    const currentTheme = html.getAttribute('data-theme')
    const themes = ['abyss', 'cupcake', 'dark', 'cyberpunk', 'forest', 'luxury', 'valentine', 'aqua']
    const currentIndex = themes.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    html.setAttribute('data-theme', themes[nextIndex])
    localStorage.setItem('theme', themes[nextIndex])
    showToast(`🎨 Mavzu: ${themes[nextIndex]}`, 'success')
})

const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme)
}

// История
function saveToHistory(text) {
    const item = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString('uz-UZ'),
        voice: select.value,
        pitch: pitchSlider.value,
        rate: rateSlider.value,
        volume: volumeSlider.value
    }
    
    history.unshift(item)
    if (history.length > 20) {
        history = history.slice(0, 20)
    }
    
    localStorage.setItem('speechHistory', JSON.stringify(history))
    loadHistory()
}

function loadHistory() {
    historyList.innerHTML = ''
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-center text-gray-500 py-4">Tarix bo\'sh</p>'
        return
    }
    
    history.forEach((item, index) => {
        const div = document.createElement('div')
        div.className = 'bg-base-200 p-3 rounded-lg hover:bg-base-100 transition-all group'
        div.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div class="flex-1 cursor-pointer" onclick="loadHistoryItem(${index})">
                    <p class="text-sm font-semibold line-clamp-2">${item.text}</p>
                    <p class="text-xs text-gray-500 mt-1">${item.date}</p>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="addToFavorites(${index})" class="btn btn-ghost btn-xs" title="Sevimliga qo'shish">⭐</button>
                    <button onclick="deleteHistoryItem(${index})" class="btn btn-ghost btn-xs" title="O'chirish">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        `
        historyList.appendChild(div)
    })
}

window.loadHistoryItem = function(index) {
    const item = history[index]
    input.value = item.text
    updateStats()
    
    const voiceOption = Array.from(select.options).find(opt => opt.value === item.voice)
    if (voiceOption) {
        select.value = item.voice
    }
    
    pitchSlider.value = item.pitch
    pitchValue.textContent = item.pitch
    
    rateSlider.value = item.rate
    rateValue.textContent = item.rate
    
    volumeSlider.value = item.volume
    volumeValue.textContent = item.volume
    
    showToast('✅ Tarixdan yuklandi', 'success')
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

window.deleteHistoryItem = function(index) {
    history.splice(index, 1)
    localStorage.setItem('speechHistory', JSON.stringify(history))
    loadHistory()
    showToast('🗑️ O\'chirildi', 'info')
}

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Barcha tarixni o\'chirmoqchimisiz?')) {
        history = []
        localStorage.removeItem('speechHistory')
        loadHistory()
        showToast('🧹 Tarix tozalandi', 'success')
    }
})

// Избранное
window.addToFavorites = function(historyIndex) {
    const item = history[historyIndex]
    
    // Проверка на дубликаты
    const exists = favorites.some(fav => fav.text === item.text)
    if (exists) {
        showToast('⚠️ Bu allaqachon sevimlilarda', 'warning')
        return
    }
    
    favorites.unshift(item)
    if (favorites.length > 10) {
        favorites = favorites.slice(0, 10)
    }
    
    localStorage.setItem('speechFavorites', JSON.stringify(favorites))
    loadFavorites()
    showToast('⭐ Sevimliga qo\'shildi!', 'success')
}

favoriteBtn.addEventListener('click', () => {
    if (!input.value.trim()) {
        showToast('Matn kiriting!', 'error')
        return
    }
    
    const item = {
        id: Date.now(),
        text: input.value,
        date: new Date().toLocaleString('uz-UZ'),
        voice: select.value,
        pitch: pitchSlider.value,
        rate: rateSlider.value,
        volume: volumeSlider.value
    }
    
    const exists = favorites.some(fav => fav.text === item.text)
    if (exists) {
        showToast('⚠️ Bu allaqachon sevimlilarda', 'warning')
        return
    }
    
    favorites.unshift(item)
    if (favorites.length > 10) {
        favorites = favorites.slice(0, 10)
    }
    
    localStorage.setItem('speechFavorites', JSON.stringify(favorites))
    loadFavorites()
    showToast('⭐ Sevimliga qo\'shildi!', 'success')
})

function loadFavorites() {
    favoritesList.innerHTML = ''
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="text-center text-gray-500 py-4">Sevimlilar bo\'sh</p>'
        return
    }
    
    favorites.forEach((item, index) => {
        const div = document.createElement('div')
        div.className = 'bg-base-200 p-3 rounded-lg hover:bg-base-100 transition-all group'
        div.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div class="flex-1 cursor-pointer" onclick="loadFavoriteItem(${index})">
                    <p class="text-sm font-semibold line-clamp-2">⭐ ${item.text}</p>
                    <p class="text-xs text-gray-500 mt-1">${item.date}</p>
                </div>
                <button onclick="deleteFavoriteItem(${index})" class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `
        favoritesList.appendChild(div)
    })
}

window.loadFavoriteItem = function(index) {
    const item = favorites[index]
    input.value = item.text
    updateStats()
    
    const voiceOption = Array.from(select.options).find(opt => opt.value === item.voice)
    if (voiceOption) {
        select.value = item.voice
    }
    
    pitchSlider.value = item.pitch
    pitchValue.textContent = item.pitch
    
    rateSlider.value = item.rate
    rateValue.textContent = item.rate
    
    volumeSlider.value = item.volume
    volumeValue.textContent = item.volume
    
    showToast('⭐ Sevimlilardan yuklandi', 'success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

window.deleteFavoriteItem = function(index) {
    favorites.splice(index, 1)
    localStorage.setItem('speechFavorites', JSON.stringify(favorites))
    loadFavorites()
    showToast('🗑️ Sevimlilardan o\'chirildi', 'info')
}

// Сохранение пресета
saveBtn.addEventListener('click', () => {
    const preset = {
        voice: select.value,
        pitch: pitchSlider.value,
        rate: rateSlider.value,
        volume: volumeSlider.value
    }
    localStorage.setItem('speechPreset', JSON.stringify(preset))
    showToast('💾 Sozlamalar saqlandi!', 'success')
    
    // Анимация кнопки
    saveBtn.classList.add('btn-success')
    setTimeout(() => {
        saveBtn.classList.remove('btn-success')
    }, 1000)
})

const savedPreset = localStorage.getItem('speechPreset')
if (savedPreset) {
    const preset = JSON.parse(savedPreset)
    setTimeout(() => {
        if (preset.voice) select.value = preset.voice
        pitchSlider.value = preset.pitch
        pitchValue.textContent = preset.pitch
        rateSlider.value = preset.rate
        rateValue.textContent = preset.rate
        volumeSlider.value = preset.volume
        volumeValue.textContent = preset.volume
    }, 100)
}

// Визуализатор
function startVisualizer() {
    stopVisualizer()
    let bars = visualizer.querySelectorAll('.bar')
    
    visualizerInterval = setInterval(() => {
        bars.forEach(bar => {
            const height = Math.random() * 100
            bar.style.height = height + '%'
        })
    }, 100)
}

function stopVisualizer() {
    if (visualizerInterval) {
        clearInterval(visualizerInterval)
        visualizerInterval = null
    }
    
    let bars = visualizer.querySelectorAll('.bar')
    bars.forEach(bar => {
        bar.style.height = '20%'
    })
}

// Создание баров визуализатора
for (let i = 0; i < 20; i++) {
    const bar = document.createElement('div')
    bar.className = 'bar bg-primary rounded-t transition-all duration-100'
    bar.style.height = '20%'
    visualizer.appendChild(bar)
}

// Скачивание (экспорт в файл)
downloadBtn.addEventListener('click', () => {
    if (!input.value.trim()) {
        showToast('Matn kiriting!', 'error')
        return
    }
    
    const data = {
        text: input.value,
        voice: select.value,
        pitch: pitchSlider.value,
        rate: rateSlider.value,
        volume: volumeSlider.value,
        date: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `speech-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    showToast('📥 Fayl yuklandi!', 'success')
})

// Toast уведомления с улучшенной анимацией
function showToast(message, type = 'info') {
    const toast = document.createElement('div')
    const colors = {
        info: 'alert-info',
        success: 'alert-success',
        error: 'alert-error',
        warning: 'alert-warning'
    }
    
    toast.className = `alert ${colors[type]} fixed top-4 right-4 w-auto max-w-xs shadow-lg z-50 animate-slide-in`
    toast.innerHTML = `<span>${message}</span>`
    document.body.appendChild(toast)
    
    setTimeout(() => {
        toast.classList.add('animate-slide-out')
        setTimeout(() => toast.remove(), 300)
    }, 3000)
}

// Shake анимация для ошибок
function shakeElement(element) {
    element.classList.add('animate-shake')
    setTimeout(() => {
        element.classList.remove('animate-shake')
    }, 500)
}

// Горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        button.click()
    }
    if (e.key === 'Escape' && window.speechSynthesis.speaking) {
        stopButton.click()
    }
    if (e.code === 'Space' && document.activeElement !== input && window.speechSynthesis.speaking) {
        e.preventDefault()
        pauseButton.click()
    }
    // Ctrl+S для сохранения
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        saveBtn.click()
    }
    // Ctrl+D для избранного
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        favoriteBtn.click()
    }
})

// Демо тексты
let demoTexts = [
    'Assalomu alaykum! Men sun\'iy intellekt yordamchisi',
    'Bugun ob-havo juda yaxshi va quyoshli',
    'O\'zbek tili dunyodagi eng go\'zal tillardan biri',
    'Texnologiya hayotimizni osonlashtiradi va yaxshilaydi',
    'Ilm-fan taraqqiyoti insoniyat kelajagini belgilaydi',
    'Kitob o\'qish eng foydali mashg\'ulotlardan biri'
]

let demoIndex = 0
document.querySelector('#demoBtn')?.addEventListener('click', () => {
    input.value = demoTexts[demoIndex]
    updateStats()
    demoIndex = (demoIndex + 1) % demoTexts.length
    
    // Эффект печати
    input.value = ''
    let text = demoTexts[demoIndex]
    let i = 0
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            input.value += text[i]
            updateStats()
            i++
        } else {
            clearInterval(typeInterval)
        }
    }, 50)
})

// Drag and drop для загрузки текстовых файлов
input.addEventListener('dragover', (e) => {
    e.preventDefault()
    input.classList.add('border-primary', 'border-2')
})

input.addEventListener('dragleave', () => {
    input.classList.remove('border-primary', 'border-2')
})

input.addEventListener('drop', (e) => {
    e.preventDefault()
    input.classList.remove('border-primary', 'border-2')
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/plain') {
        const reader = new FileReader()
        reader.onload = (e) => {
            input.value = e.target.result
            updateStats()
            showToast('📄 Fayl yuklandi!', 'success')
        }
        reader.readAsText(file)
    } else {
        showToast('Faqat .txt fayllar qo\'llab-quvvatlanadi', 'error')
    }
})

// Копирование текста
document.querySelector('#copyBtn')?.addEventListener('click', () => {
    if (!input.value.trim()) {
        showToast('Matn yo\'q!', 'error')
        return
    }
    
    navigator.clipboard.writeText(input.value).then(() => {
        showToast('📋 Nusxalandi!', 'success')
    })
})

// Очистка текста
document.querySelector('#clearBtn')?.addEventListener('click', () => {
    if (confirm('Matnni o\'chirmoqchimisiz?')) {
        input.value = ''
        updateStats()
        showToast('🧹 Tozalandi', 'info')
    }
})

console.log('🎙️ Nutq Sintezatori Pro v3.0 ishga tushdi!')