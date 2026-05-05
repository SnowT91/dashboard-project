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

    // Первичная отрисовка 
    renderProjects();
}

// --- UI ЛОГИКА (ИНТЕРФЕС И РЕНДЕР)

// Находим элементы DOM
const btnTabProjects = document.getElementById('btn-tab-projects');
const btnTabEmployees = document.getElementById('btn-tab-employees');
const projectsView = document.getElementById('projects-view');
const employeesView = document.getElementById('employees-view');

// Слушатели событий для переключения вкладок
btnTabProjects.addEventListener('click', () => {
    projectsView.style.display = 'block';
    employeesView.style.display = 'none';

    // Опционально: переключаем классы активности для стилей
    btnTabProjects.classList.add('active');
    btnTabEmployees.classList.remove('active');

    renderProjects(); // Обновляем таблицу при переходе
});

btnTabEmployees.addEventListener('click', () => {
    projectsView.style.display = 'none';
    employeesView.style.display = 'block';

    btnTabEmployees.classList.add('active');
    btnTabProjects.classList.remove('active');

    renderEmployees(); // Обновляем таблицу при переходе
});

// Отрисовка таблицы сотрудников
function renderEmployees() {
    const tbody = document.getElementById('employees-tbody');
    const periodKey = getCurrentPeriodKey();
    const employees = state.data[periodKey].employees;

    tbody.innerHTML = ''; // Очищаем таблицу перед каждой новой отрисовкой

    employees.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.surname}</td>
            <td>${emp.position}</td>
            <td>$${emp.salary.toFixed(2)}</td>
            <td>
                <!-- Кнопка удаления. Мы вешаем на нее data-атрибут с ID -->
                <button class="delete-emp-btn" data-id="${emp.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Отрисовка таблицы проектов
function renderProjects() {
    const tbody = document.getElementById('projects-tbody');
    const periodKey = getCurrentPeriodKey();
    const projects = state.data[periodKey].projects;

    tbody.innerHTML = '';

    projects.forEach(proj => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${proj.companyName}</td>
            <td>${proj.projectName}</td>
            <td>$${proj.budget.toFixed(2)}</td>
            <td>0/${proj.employeeCapacity}</td>
            <td>
                <button class="delete-proj-btn" data-id="${proj.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Делегирование событий для удаления сотрудника
document.getElementById('employees-tbody').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-emp-btn')) {
        // Достаем ID из data-id атрибута
        const employeeId = e.target.getAttribute('data-id');
        deleteEmployee(employeeId); // Удаляем из state
        renderEmployees();           // Перерисовываем UI
    }
});

// Делегирование событий для удаления проекта
document.getElementById('projects-tbody').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-proj-btn')) {
        const projectId = e.target.getAttribute('data-id');
        deleteProject(projectId);
        renderProjects();
    }
});

// --- ЛОГИКА ФОРМ И ВАЛИДАЦИИ ---

// Элементы формы проектов
const projectForm = document.getElementById('project-form');
const btnShowProjectForm = document.getElementById('btn-show-project-form');
const btnCancelProject = document.getElementById('btn-cancel-project');
const btnSubmitProject = document.getElementById('btn-submit-project');

// Элементы формы сотрудников
const employeeForm = document.getElementById('employee-form');
const btnShowEmployeeForm = document.getElementById('btn-show-employee-form');
const btnCancelEmployee = document.getElementById('btn-cancel-employee');
const btnSubmitEmployee = document.getElementById('btn-submit-employee');

// Функции показать/скрыть формы
btnShowProjectForm.addEventListener('click', () => {
    projectForm.style.display = 'block';
    btnShowProjectForm.style.display = 'none';
});
btnCancelProject.addEventListener('click', () => {
    projectForm.style.display = 'none';
    btnShowProjectForm.style.display = 'inline-block';
    projectForm.reset();
    btnSubmitProject.disabled = true; // Сбрасываем кнопку
});

btnShowEmployeeForm.addEventListener('click', () => {
    employeeForm.style.display = 'block';
    btnShowEmployeeForm.style.display = 'none';
});
btnCancelEmployee.addEventListener('click', () => {
    employeeForm.style.display = 'none';
    btnShowEmployeeForm.style.display = 'inline-block';
    employeeForm.reset();
    btnSubmitEmployee.disabled = true;
});

// Real-time валидация: проверяем форму при каждом входе
projectForm.addEventListener('input', () => {
    // checkValidity() - встроенный метод JS, который проверяет все правила (required, minlength и т.д.)
    btnSubmitProject.disabled = !projectForm.checkValidity();
});
projectForm.addEventListener('blur', () => btnSubmitProject.disabled = !projectForm.checkValidity(), true);

employeeForm.addEventListener('input', () => {
    // Для сотрудника нужно дополнительно проверить возраст (18+)
    let isAgeValid = false;
    const dobInput = document.getElementById('emp-dob').value;

    if (dobInput) {
        const birthDate = new Date(dobInput);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        isAgeValid = age >= 18;
    }

    // Кнопка активна, если стандартные проверки HTML пройдены И возраст >= 18
    btnSubmitEmployee.disabled = !(employeeForm.checkValidity() && isAgeValid);
});

// Отправка формы проектов
projectForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Отменяем перезагрузку страницы

    const name = document.getElementById('proj-name').value;
    const company = document.getElementById('proj-company').value;
    const budget = document.getElementById('proj-budget').value;
    const capacity = document.getElementById('proj-capacity').value;

    addProject(name, company, budget, capacity);
    renderProjects();

    btnCancelProject.click(); // Имитируем клик по Cancel, чтобы скрыть форму и очистить её  
});

// Отправка формы сотрудников
employeeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('emp-name').value;
    const surname = document.getElementById('emp-surname').value;
    const dob = document.getElementById('emp-dob').value;
    const position = document.getElementById('emp-position').value;
    const salary = document.getElementById('emp-salary').value;

    addEmployee(name, surname, dob, position, salary);
    renderEmployees();

    btnCancelEmployee.click();
});

// Запускаем приложение
initApp();