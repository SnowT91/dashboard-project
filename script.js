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

// Генерация уникального ID
function generateId() {
    // Используем встроенный криптографический API браузера
    return window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
}

// --- ЛОГИКА СОТРУДНИКОВ (EMPLOYEES) ---
function addEmployee(name, surname, dateOfBirth, position, salary) {
    const periodKey = getCurrentPeriodKey();
    
    const newEmployee = {
        id: generateId(),
        name: name,
        surname: surname,
        dateOfBirth: dateOfBirth,
        position: position,
        salary: Number(salary), // Убедимся, что зарплата сохраняется как число
        assignments: [],         // Список проектов, к которым прикреплен сотрудник
        vacations: []           // Дни отпуска сотрудника в текущем месяце
   };
    
   // Добавляем нового сотрудника в массив текущего месяца
    state.data[periodKey].employees.push(newEmployee);
    
    // Сохраняем изменения
    saveData();
    console.log(`Employee ${name} ${surname} added successfully.`);

    return newEmployee;
}

function deleteEmployee(employeeId) {
    const periodKey = getCurrentPeriodKey();

    // Оставляем в массиве только тех сотрудников, чей ID НЕ совпадает с удаляемым
    state.data[periodKey].employees = state.data[periodKey].employees.filter(emp => emp.id !== employeeId);

    saveData();
    console.log(`Employee with ID ${employeeId} deleted successfully.`);
}

// --- ЛОГИКА ПРОЕКТОВ (PROJECTS) ---

function addProject(projectName, companyName, budget, employeeCapacity) {
    const periodKey = getCurrentPeriodKey();

    const newProject = {
       id: generateId(),
       projectName: projectName,
       companyName: companyName,
       budget: Number(budget),
       employeeCapacity: Number(employeeCapacity) 
    };

    state.data[periodKey].projects.push(newProject);
    saveData();
    console.log(`Project "${projectName}" added successfully!`);

    return newProject;
}

function deleteProject(projectId) {
    const periodKey = getCurrentPeriodKey();

    state.data[periodKey].projects = state.data[periodKey].projects.filter(proj => proj.id !== projectId);

    saveData();
    console.log(`Project with ID ${projectId} deleted successfully.`);
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