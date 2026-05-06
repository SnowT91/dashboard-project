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

// Назначить проект сотруднику
function assignProjectToEmployee(employeeId, projectId) {
    const periodKey = getCurrentPeriodKey();
    const data = state.data[periodKey];

    const employee = data.employees.find(emp => emp.id === employeeId);
    const project = data.projects.find(proj => proj.id === projectId);

    if (!employee || !project) return;

    // Считаем, сколько сотрудников уже назначено на этот проект
    const assignedCount = data.employees.filter(emp => emp.assignments.includes(projectId)).length;

    if (assignedCount >= project.employeeCapacity) {
        alert(`Cannot assign! Project "${project.projectName}" has reached its maximum capacity of${project.employeeCapacity}.`);
        return;
    }

    // Добавляем ID проекта сотруднику, если его там ещё нет
    if (!employee.assignments.includes(projectId)) {
        employee.assignments.push(projectId);
        saveData();
    }
}

// Отвязать проект от сотрудника
function unassignProjectFromEmployee(employeeId, projectId) {
    const periodKey = getCurrentPeriodKey();
    const employee = state.data[periodKey].employees.find(emp => emp.id === employeeId);

    if (employee) {
        employee.assignments = employee.assignments.filter(id => id !== projectId);
        saveData();
    }
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
    const data = state.data[periodKey];

    // Удаляем сам проект
    data.projects = data.projects.filter(proj => proj.id !== projectId);

    // Удаляем ID этого проекта из назначений всех сотрудников
    data.employees.forEach (emp => {
        emp.assignments = emp.assignments.filter(id => id !== projectId);
    });

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

// Функция расчета статистики
function updateDashboardStats() {
    const periodKey = getCurrentPeriodKey();
    const currentData = state.data[periodKey];

    const totalBudget = currentData.projects.reduce((sum, proj) => sum + proj.budget, 0);
    const totalSalary = currentData.employees.reduce((sum, emp) => sum + emp.salary, 0);

    document.getElementById('stat-total-budget').textContent = `$${totalBudget.toFixed(2)}`;
    document.getElementById('stat-total-salary').textContent = `$${totalSalary.toFixed(2)}`;
}

// Отрисовка таблицы сотрудников
function renderEmployees() {
    const tbody = document.getElementById('employees-tbody');
    const periodKey = getCurrentPeriodKey();
    const data = state.data[periodKey];

    tbody.innerHTML = ''; // Очищаем таблицу перед каждой новой отрисовкой

    // Генерируем опции для выпадающего списка проектов
    const projectOptions =data.projects.map(p => `<option value="${p.id}">${p.projectName}</option>`).join('');

    data.employees.forEach(emp => {
        // Собираем HTML для уже назначенных проектов (в виде маленьких "тегов" с кнопкой удаления)
        const assignmentsHtml = emp.assignments.map(projectId => {
            const project = data.projects.find(p => p.id === projectId);
            if (!project) return ''; // Если проект был удален, пропускаем
            return `<div class="assignment-tag">
                        ${project.projectName} 
                        <button class="unassign-btn" data-emp-id="${emp.id}" data-proj-id="${project.id}">x</button>
                    </div>`;
        }).join('');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.surname}</td>
            <td>${emp.position}</td>
            <td>$${emp.salary.toFixed(2)}</td>
            <td>
                <div class="assignments-list">${assignmentsHtml}</div>
                <select class="assign-select" data-emp-id="${emp.id}">
                    <option value="" disabled selected>+ Assign to...</option>
                    ${projectOptions}
                </select>
            </td>
            <td>
                <!-- Кнопка удаления. Мы вешаем на нее data-атрибут с ID -->
                <button class="delete-emp-btn" data-id="${emp.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateDashboardStats();
}

// Отрисовка таблицы проектов
function renderProjects() {
    const tbody = document.getElementById('projects-tbody');
    const periodKey = getCurrentPeriodKey();
    const data = state.data[periodKey];

    tbody.innerHTML = '';

    data.projects.forEach(proj => {
        //Считаем количество сотрудников, у которых в массиве assignments есть ID этого проекта
        const assignedCount = data.employees.filter(emp => emp.assignments.includes(proj.id)).length;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${proj.companyName}</td>
            <td>${proj.projectName}</td>
            <td>$${proj.budget.toFixed(2)}</td>
            <td>${assignedCount} / ${proj.employeeCapacity}</td> <!-- Выводим реальные данные -->
            <td>
                <button class="delete-proj-btn" data-id="${proj.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateDashboardStats();
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

function validateEmployeeForm() {
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
}

employeeForm.addEventListener('input', validateEmployeeForm);
employeeForm.addEventListener('blur', validateEmployeeForm, true);

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

// Назначение на проект через выпадающий список
document.getElementById('employees-tbody').addEventListener('change', (e) => {
    if (e.target.classList.contains('assign-select')) {
        const employeeId = e.target.getAttribute('data-emp-id');
        const projectId = e.target.value;

        assignProjectToEmployee(employeeId, projectId);

        // Перерисовываем обу таблицы, так как изменились данные и там, и там
        renderEmployees();
        renderProjects();
    }
});

// Отвязка от проекта через кнопку "x"
document.getElementById('employees-tbody').addEventListener('click', (e) => {
    if (e.target.classList.contains('unassign-btn')) {
        const employeeId = e.target.getAttribute('data-emp-id');
        const projectId = e.target.getAttribute('data-proj-id');

        unassignProjectFromEmployee(employeeId, projectId);

        renderEmployees();
        renderProjects();
    }
});

// Запускаем приложение
initApp();