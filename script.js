// Константы приложения 
const STORAGE_KEY = 'monthlyData';

// Глобальное состояние приложения (State)
const state = {
    currentMonth: new Date().getMonth(), // 0-11
    currentYear: new Date().getFullYear(), // например, 2026
    data: {}, // Сюда будем загружать данные из localStorage
    // Состояние сортировки
    sort: {
        employees: { key: null, asc: true },
        projects: { key: null, asc: true }
    },
    employeeToAssign: null // Для хранения ID сотрудника, которого хотим назначить на проект
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
        name,
        surname,
        dateOfBirth,
        position,
        salary: Number(salary), // Убедимся, что зарплата сохраняется как число
        assignments: [],        // Список проектов, к которым прикреплен сотрудник
        vacations: []           // Дни отпуска сотрудника в текущем месяце
   };
    
   // Добавляем нового сотрудника в массив текущего месяца
    state.data[periodKey].employees.push(newEmployee);
    
    // Сохраняем изменения
    saveData();
    return newEmployee;
}

function deleteEmployee(employeeId) {
    const periodKey = getCurrentPeriodKey();

    // Оставляем в массиве только тех сотрудников, чей ID НЕ совпадает с удаляемым
    state.data[periodKey].employees = state.data[periodKey].employees.filter(emp => emp.id !== employeeId);
    saveData();
}

// Обновление данных сотрудника (Inline Editing)
function updateEmployeeField(employeeId, field, value) {
    const periodKey = getCurrentPeriodKey();
    const employee = state.data[periodKey].employees.find(emp => emp.id === employeeId);
    if (employee) {
        employee[field] = field === 'salary' ? Number(value) : value;
        saveData();
    }
}

// --- ЛОГИКА ПРОЕКТОВ (PROJECTS) ---

function addProject(projectName, companyName, budget, employeeCapacity) {
    const periodKey = getCurrentPeriodKey();

    const newProject = {
       id: generateId(),
       projectName,
       companyName,
       budget: Number(budget),
       employeeCapacity: Number(employeeCapacity) 
    };

    state.data[periodKey].projects.push(newProject);
    saveData();
    return newProject;
}

function deleteProject(projectId) {
    const periodKey = getCurrentPeriodKey();
    const data = state.data[periodKey];

    // Удаляем сам проект
    data.projects = data.projects.filter(proj => proj.id !== projectId);

    // Удаляем ID этого проекта из назначений всех сотрудников
    data.employees.forEach (emp => {
        emp.assignments = emp.assignments.filter(assignments => assignments.projectId !== projectId);
    });

    saveData();
}

// Функция назначения сотрудника на проект
function assignEmployeeToProject(employeeId, projectId) {
    const periodKey = getCurrentPeriodKey();
    const data = state.data[periodKey];
    const employee = data.employees.find(emp => emp.id === employeeId);

    if (employee && projectId) {
        // Проверяем, не назначен ли уже сотрудник на этот проект
        const alreadyAssigned = employee.assignments.some(a => a.projectId === projectId);
        if (!alreadyAssigned) {
            employee.assignments.push({ projectId: projectId });
            saveData();
        }
    }
}

// --- СОРТИРОВКА (SORTING) ---
function sortData(tableName, key) {
    const periodKey = getCurrentPeriodKey();
    const dataArray = state.data[periodKey][tableName];

    // Переключаем направление, если кликнули по той же колонке
    if (state.sort[tableName].key === key) {
        state.sort[tableName].asc = !state.sort[tableName].asc;
    } else {
        state.sort[tableName].key = key;
        state.sort[tableName].asc = true;
    }

    const asc = state.sort[tableName].asc ? 1 : -1;

    dataArray.sort((a, b) => {
        if (a[key] > b[key]) return 1 * asc;
        if (a[key] < b[key]) return -1 * asc;
        return 0;
    });

    if (tableName === 'employees') renderEmployees();
    if (tableName === 'projects') renderProjects();
}

// Обработчик кликов по заголовкам таблиц
document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-sort');
        const tableName = e.target.getAttribute('data-table');
        if (key && tableName) {
            sortData(tableName, key);
        }
    });
});

// --- UI ИНИЦИАЛИЗАЦИЯ И НАВИГАЦИЯ ---
function initApp() {
    loadData();
    initPeriodSelectors();

    // Первичная отрисовка 
    renderProjects();
    renderEmployees();
}

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

// --- САЙДБАР ---
const sidebar = document.getElementById('sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    btnToggleSidebar.textContent = sidebar.classList.contains('collapsed') ? '→' : '☰';
});

// --- ВЫБОР ПЕРИОДА (МЕСЯЦ/ГОД) ---
const monthSelector = document.getElementById('month-selector');
const yearSelector = document.getElementById('year-selector');

function initPeriodSelectors() {
    monthSelector.value = state.currentMonth;
    // Если текущего года нет в селекторе (например, сейчас 2024), поставим дефолт 2026
    const hasYear = Array.from(yearSelector.options).some(opt => opt.value == state.currentYear);
    if (!hasYear) state.currentYear = 2026;
    yearSelector.value = state.currentYear;
}

function handlePeriodChange() {
    state.currentMonth = parseInt(monthSelector.value);
    state.currentYear = parseInt(yearSelector.value);
    // Подгружаем или создаем пустые данные для нового месяца
    loadData();
    // Перерисовываем UI
    renderProjects();
    renderEmployees();
}

monthSelector.addEventListener('change', handlePeriodChange);
yearSelector.addEventListener('change', handlePeriodChange);

// --- РЕНДЕР ТАБЛИЦ ---
// Для сотрудника нужно дополнительно проверить возраст (18+)
function calculateAge(dobString) {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
    return age;  
}

// Отрисовка таблицы сотрудников
function renderEmployees() {
    const tbody = document.getElementById('employees-tbody');
    const data = state.data[getCurrentPeriodKey()];
    tbody.innerHTML = ''; // Очищаем таблицу перед каждой новой отрисовкой

    const positions = ['Junior', 'Middle', 'Senior', 'Lead', 'Architect', 'BO'];

    data.employees.forEach(emp => {
        const age = calculateAge(emp.dateOfBirth);

        // Генерируем опции для селекта позиции
        const positionOptions = positions.map(pos => 
            `<option value="${pos}" ${emp.position === pos ? 'selected' : ''}>${pos}</option>`
        ).join('');

        // Получаем названия проектов, к которым прикреплен сотрудник
        const assignedProjectsNames = emp.assignments.map(a => {
            const proj = data.projects.find(p => p.id === a.projectId);
            return proj ? proj.projectName : 'Unknown';
        }).join(', ') || 'Unassigned';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.surname}</td>
            <td>${age}</td>
            <td>
                <select class="inline-select update-emp-field" data-id="${emp.id}" data-field="position">
                    ${positionOptions}
                </select>
            </td>
            <td style="display: flex; align-items: center;">
                $<input type="number" class="inline-input update-emp-field" data-id="${emp.id}" data-field="salary" value="${emp.salary.toFixed(2)}" min="0.01" step="0.01" style="margin-left: 2px;">
            </td>
            <td>$0.00</td> <!-- Est Payment -->
            <td>${assignedProjectsNames}</td>
            <td>$0.00</td> <!-- Projected Income -->
            <td>
                <button class="btn-availability">Availability</button>
                <button class="btn-assign" data-id="${emp.id}">Assign</button>
                <button class="delete-emp-btn" data-id="${emp.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Отрисовка таблицы проектов
function renderProjects() {
    const tbody = document.getElementById('projects-tbody');
    const data = state.data[getCurrentPeriodKey()];
    tbody.innerHTML = '';

    data.projects.forEach(proj => {
        // Считаем, сколько сотрудников уже назначено на этот проект
        const assignedCount = data.employees.filter(emp => 
            emp.assignments.some(a => a.projectId === proj.id)
        ).length;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${proj.companyName}</td>
            <td>${proj.projectName}</td>
            <td>$${proj.budget.toFixed(2)}</td>
            <td>${assignedCount} / ${proj.employeeCapacity}</td> <!-- Выводим реальные данные -->
            <td>
                <button class="btn-show-employees">Show Employees (${assignedCount})</button>
            </td>
            <td>$0.00</td> <!-- Estimated Income -->
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
        deleteEmployee(e.target.getAttribute('data-id'));   // Удаляем из state
        renderEmployees();                                  // Перерисовываем UI
    }
});

// Слушатель для Inline Editing (событие 'change' срабатывает, когда инпут теряет фокус после изменения)
document.getElementById('employees-tbody').addEventListener('change', (e) => {
    if (e.target.classList.contains('update-emp-field')) {
        const employeeId = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const value = e.target.value;

        if (e.target.checkValidity()) { 
            updateEmployeeField(employeeId, field, value);
            renderEmployees(); // Перерисовываем для форматирования
        } else {
            alert('Invalid input');
            renderEmployees(); // Возвращаем старое значение
        }
    }
});

// Делегирование событий для удаления проекта
document.getElementById('projects-tbody').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-proj-btn')) {
        deleteProject(e.target.getAttribute('data-id'));
        renderProjects();
    }
});
        
// --- ЛОГИКА ФОРМ И ВАЛИДАЦИИ ---

// Элементы формы проектов
const projectForm = document.getElementById('project-form');
const btnShowProjectForm = document.getElementById('btn-show-project-form');
const btnCancelProject = document.getElementById('btn-cancel-project');
const btnSubmitProject = document.getElementById('btn-submit-project');

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

// Real-time валидация: проверяем форму при каждом входе
projectForm.addEventListener('input', () => btnSubmitProject.disabled = !projectForm.checkValidity());
// Отправка формы проектов
projectForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Отменяем перезагрузку страницы
    addProject(
        document.getElementById('proj-name').value,
        document.getElementById('proj-company').value,
        document.getElementById('proj-budget').value,
        document.getElementById('proj-capacity').value
    );
    renderProjects();
    btnCancelProject.click(); // Имитируем клик по Cancel, чтобы скрыть форму и очистить её  
});

// Элементы формы сотрудников
const employeeForm = document.getElementById('employee-form');
const btnShowEmployeeForm = document.getElementById('btn-show-employee-form');
const btnCancelEmployee = document.getElementById('btn-cancel-employee');
const btnSubmitEmployee = document.getElementById('btn-submit-employee');

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

function validateEmployeeForm() {
    // Для сотрудника нужно дополнительно проверить возраст (18+)
    let isAgeValid = false;
    const dobInput = document.getElementById('emp-dob').value;

    if (dobInput) {
        isAgeValid = calculateAge(dobInput) >= 18;
    }
    btnSubmitEmployee.disabled = !(employeeForm.checkValidity() && isAgeValid);
}
employeeForm.addEventListener('input', validateEmployeeForm);       
        
// Отправка формы сотрудников
employeeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addEmployee(
        document.getElementById('emp-name').value,
        document.getElementById('emp-surname').value,
        document.getElementById('emp-dob').value,
        document.getElementById('emp-position').value,
        document.getElementById('emp-salary').value
    );
    renderEmployees();
    btnCancelEmployee.click();
});

// --- ЛОГИКА МОДАЛКИ НАЗНАЧЕНИЙ (ASSIGNMENTS) ---
const assignModal = document.getElementById('assign-modal');
const btnCloseAssignModal = document.getElementById('btn-close-assign-modal');
const btnConfirmAssign = document.getElementById('btn-confirm-assign');
const assignProjectSelect = document.getElementById('assign-project-select');
const assignEmpName = document.getElementById('assign-emp-name');

// Открытие модалки (делегирование событий в таблице сотрудников)
document.getElementById('employees-tbody').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-assign')) {
        const empId = e.target.getAttribute('data-id');
        const periodKey = getCurrentPeriodKey();
        const data = state.data[periodKey];
        const employee = data.employees.find(emp => emp.id === empId);

        if (!employee) return;

        state.employeeToAssign = empId;
        assignEmpName.textContent = `${employee.name} ${employee.surname}`;

        // Заполняем селект проектами, где ещё есть место
        assignProjectSelect.innerHTML = '<option value="" disabled selected>Select a project...</option>'
        data.projects.forEach(proj => {
            const assignedCount = data.employees.filter(e => e.assignments.some(a => a.projectId === proj.id)).length;
            if (assignedCount < proj.employeeCapacity) {
                assignProjectSelect.innerHTML += `<option value="${proj.id}">${proj.projectName} (${proj.companyName})</option>`;
            }
        });

        assignModal.style.display = 'flex';
    }
});

// Закрытие модалки
btnCloseAssignModal.addEventListener('click', () => {
    assignModal.style.display = 'none';
    state.employeeToAssign = null;
});

// Подтверждение назначения
btnConfirmAssign.addEventListener('click', () => {
    const projectId = assignProjectSelect.value;
    if (state.employeeToAssign && projectId) {
        assignEmployeeToProject(state.employeeToAssign, projectId);
        assignModal.style.display = 'none';
        state.employeeToAssign = null;

        // Переписываем таблицы, чтобы обновить счетчики и имена
        renderEmployees();
        renderProjects();
    }
});

// --- Логика DARK MODE ---
const btnToggleTheme = document.getElementById('btn-toggle-theme');

btnToggleTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    // Сохраняем выбор в localStorage
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Проверяем тему при загрузке страницы
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// Запускаем приложение
initApp();