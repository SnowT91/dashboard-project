// Константы приложения 
const STORAGE_KEY = 'monthlyData';

// Глобальное состояние приложения (State)
const state = {
    currentMonth: new Date().getMonth(), // 0-11
    currentYear: new Date().getFullYear(), // например, 2026
    data: {} // Сюда будем загружать данные из localStorage
};

// Функция для получения ключа текущего месяца (например, в формате "2026-0" для января 2026)
function getCurrentPeriodKey() {
    return `${state.currentYear}-${state.currentMonth}`;
}

// Инициализация структуры данных, если она пустая
function getEmptyMonthData() {
    return {
        employees: [],
        projects: []
    };
}

// Функция для загрузки данных из localStorage
function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
        state.data = JSON.parse(savedData);
    } else {
        // Если данных вообще нет, создаем пустой объект 
        state.data = {};
    }

    // Проверяем, есть ли данные для текущего выбранного месяца
    const periodKey = getCurrentPeriodKey();
    if (!state.data[periodKey]) {
        state.data[periodKey] = getEmptyMonthData();
        saveData(); // Сразу сохраняем новую пустую структуру для этого месяца
    }
}

// Функция для сохранения текущего состояния в localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

// Функция, которая запускается при старте приложения
function initApp() {
    loadData();
    console.log("App initialized. Current data:", state.data);
    console.log("Current period:", getCurrentPeriodKey());

    // Временно убираем текст "Загрузка..." из HTML, чтобы увидеть, что JS сработал
    document.getElementById('app').innerHTML = '<h2>Данные загружены. Загляните в консоль!</h2>';
}

    // Запускаем приложение
    initApp();