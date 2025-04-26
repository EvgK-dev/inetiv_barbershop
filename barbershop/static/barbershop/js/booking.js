
// ожидание загрузки DOM => инициализация барберов и календарей 
document.addEventListener('DOMContentLoaded', () => {
    fetchMasterData();
});

let masterData = [];

// Запрос, получение и обработка данных с сервера
function fetchMasterData() {
    fetch('/get-master-data/', {  
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'  
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); 
    })
    .then(data => {
        masterData = data; // инициализируем барберов
        initializeCalendars(); // инициализируем календари
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error); 
    });
}

// Класс CalendarManager управляет календарем и отображением доступных дат и времени для барбера
class CalendarManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.master = containerId;
        this.today = new Date();
        this.currentDate = new Date(); 
        this.init();
    }

    init() {
        this.createCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.attachEventListeners();
    }

    // Создание календаря
    createCalendar(year, month) {
        const container = document.getElementById('calendar_' + this.containerId);
        container.innerHTML = ''; 

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // Первый день месяца (0 - воскресенье, 6 - суббота)
    
        // Приводим первый день месяца к понедельнику (1)
        const adjustedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
    
        const monthNames = [
            "Январь", "Февраль", "Март",
            "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь",
            "Октябрь", "Ноябрь", "Декабрь"
        ];
    
        // Создаем шапку календаря с кнопками переключения месяцев
        const header = document.createElement('div');
        header.classList.add('calendar-header');
        header.innerHTML = `
            <span>${monthNames[month]} ${year}</span>
            <button class="select_month_button" id="prevMonth_${this.containerId}">Пред.</button>
            <button class="select_month_button" id="nextMonth_${this.containerId}">След.</button>
        `;
        container.appendChild(header);
    
        const daysContainer = document.createElement('div');
        daysContainer.classList.add('calendar-days');
    
        // Добавляем пустые ячейки для дней до первого дня месяца
        for (let i = 0; i < adjustedFirstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty-day');
            daysContainer.appendChild(emptyDay);
        }
    
        const today = new Date(); // Текущая дата
    
        const master = masterData.find(m => m.id === parseInt(this.containerId)); // Находим мастера по id

        // Проходим по дням месяца и создаем для каждого дня элемент
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = day;
    
            const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            dayElement.setAttribute('data-day', formattedDate);
    
            // Определяем день недели
            const dayOfWeek = new Date(year, month, day).getDay();
            const dayNumber = (dayOfWeek === 0) ? 7 : dayOfWeek; 
    
            // Добавляем класс "holiday" для выходных (суббота и воскресенье)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayElement.classList.add('holiday');
            }

            // Проверяем, является ли этот день текущим днём
            if (
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate()
            ) {
                dayElement.classList.add('selected'); // Присваиваем класс для текущего дня
            }
    
            // Блокируем дни меньше текущей даты
            const selectedDate = new Date(year, month, day);

            function clearTime(date) {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate());
            }
            
            if (clearTime(selectedDate) < clearTime(today)) {
                dayElement.classList.add('booked');
            }

            // Проверяем рабочие часы мастера для этого дня
            if (master) {
                const workingHours = master.working_hours.find(wh => {
                    const weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
                    return wh.day === weekdays[dayNumber - 1];
                });
    
                if (!workingHours || !workingHours.is_working) {
                    dayElement.classList.add('bookday');
                }
            }
    
            dayElement.onclick = () => this.handleDateClick(year, month, day); // клик по дню
            daysContainer.appendChild(dayElement);
        }
    
        container.appendChild(daysContainer);
    }

    // Проверяем временные интервалы на соответствие длительности услуги
    checkAvailableTimesForDuration(availableTimes, serviceDuration) {
        for (let i = 0; i < availableTimes.length; i++) {
            const currentTime = availableTimes[i];
            const currentTimeMinutes = this.convertTimeToMinutes(currentTime);

            // Проверяем длительность услуги
            if (serviceDuration === 60) {
                // Проверяем, есть ли следующее время через 30 минут
                const nextTime = availableTimes[i + 1];
                if (!nextTime || this.convertTimeToMinutes(nextTime) !== currentTimeMinutes + 30) {
                    // Если нет подходящего следующего времени, присваиваем класс .time_blocked
                    const timeElement = document.querySelector(`.time[data-time="${currentTime}"]`);
                    if (timeElement) {
                        timeElement.classList.add('time_blocked');
                    }
                }
            } else if (serviceDuration === 90) {
                // Проверяем, есть ли следующие два времени через 30 и 60 минут
                const nextTime1 = availableTimes[i + 1];
                const nextTime2 = availableTimes[i + 2];
                if (!nextTime1 || !nextTime2 ||
                    this.convertTimeToMinutes(nextTime1) !== currentTimeMinutes + 30 ||
                    this.convertTimeToMinutes(nextTime2) !== currentTimeMinutes + 60) {
                    // Если нет подходящих следующих двух времён, присваиваем класс .time_blocked
                    const timeElement = document.querySelector(`.time[data-time="${currentTime}"]`);
                    if (timeElement) {
                        timeElement.classList.add('time_blocked');
                    }
                }
            }
        }
    }

    // Метод для обработки клика по дате
    handleDateClick(year, month, day) {
        const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        // Определяем день недели
        const dayOfWeek = new Date(formattedDate).getDay();
        const dayNumber = (dayOfWeek === 0) ? 7 : dayOfWeek;

        const master = masterData.find(m => m.id === parseInt(this.containerId));

        if (master) {

            // Находим рабочие часы для этого дня
            const workingHours = master.working_hours.find(wh => {
                const weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
                return wh.day === weekdays[dayNumber - 1];
            });

            // Проверяем, не содержит ли выбранный день класс "booked"
            const dayElement = document.querySelector(`.day[data-day="${formattedDate}"]`);
            const isBooked = dayElement && dayElement.classList.contains('booked');


            if (workingHours && workingHours.is_working && !isBooked) {
                // Формируем доступные временные интервалы
                const startTime = this.convertTimeToMinutes(workingHours.start_time);
                const endTime = this.convertTimeToMinutes(workingHours.end_time) - 30;

                let availableTimes = [];

                for (let time = startTime; time <= endTime; time += 30) {
                    const formattedTime = this.convertMinutesToTime(time);

                    // Проверяем, забронировано ли это время
                    const bookedTime = master.booked_times.find(bt => bt.date === formattedDate && bt.time === formattedTime);
                    if (!bookedTime) {
                        availableTimes.push(formattedTime);
                    }
                }

                // Находим контейнер для времени
                const timesContainer = document.getElementById(`times_${this.master}`);
                timesContainer.innerHTML = '';

                // Если нет доступных времен, выводим сообщение
                if (availableTimes.length === 0) {
                    const messageElement = document.createElement('p');
                    messageElement.classList.add('time_message'); // Добавляем класс
                    messageElement.textContent = 'Извините, всё забронировано';
                    timesContainer.appendChild(messageElement);
                } else {
                    // Вставляем доступные временные интервалы в DOM
                    availableTimes.forEach(time => {
                        const timeElement = document.createElement('p');
                        timeElement.classList.add('time', 'free_time');
                        timeElement.setAttribute('data-time', time); // Добавляем атрибут для использования в будущем
                        timeElement.textContent = time;
                        timesContainer.appendChild(timeElement);
                    });

                    // Получаем длительность услуги из input
                    const container = document.getElementById('calendar_' + this.containerId);
                    if (container) {
                        const bookingBlock = container.closest('.booking_masters_block');
                        if (bookingBlock) {
                            const durationInput = bookingBlock.querySelector('input[name="duration"]');
                            if (durationInput) {
                                const serviceDuration = parseInt(durationInput.value.match(/\d+/)[0]);

                                // Проверяем доступные времена на основе длительности услуги
                                this.checkAvailableTimesForDuration(availableTimes, serviceDuration);
                            }
                        }
                    }
                }
            } else {
                this.displayNoAvailableTimeMessage(); // Скрываем блок выбора времени
            }
        } else {
            console.log('Мастер не найден.');
        }
    }

    // Метод для конвертации времени в минуты
    convertTimeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Метод для конвертации минут обратно в формат времени
    convertMinutesToTime(minutes) {
        const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
        const mins = String(minutes % 60).padStart(2, '0');
        return `${hours}:${mins}`;
    }


    attachEventListeners() {
        // Удаляем старые обработчики событий, чтобы избежать дублирования
        const prevButton = document.getElementById(`prevMonth_${this.containerId}`);
        const nextButton = document.getElementById(`nextMonth_${this.containerId}`);

        // Обновляем функции обработки кликов
        prevButton.onclick = () => this.prevMonth();
        nextButton.onclick = () => this.nextMonth();
    }


    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.createCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.attachEventListeners();  

        this.displayNoAvailableTimeMessage(); 
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.createCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.attachEventListeners();  

        this.displayNoAvailableTimeMessage(); 
    }


    displayNoAvailableTimeMessage() {
        const timesContainer = document.getElementById(`times_${this.master}`);
        timesContainer.innerHTML = ''; 
    
        const timeElement = document.createElement('p');
        timeElement.classList.add('time_message');
        timeElement.textContent = 'Выберите доступную дату';
    
        timesContainer.appendChild(timeElement);
    }
    
}

// создание календарей
function initializeCalendars() {
    const calendarElements = document.querySelectorAll('.calendar'); // Находим все элементы с классом "calendar"
    const calendarIds = []; // Создаем пустой массив calendarIds

    calendarElements.forEach(function (element) {
        const id = element.id.replace(/\D/g, ''); 

        if (id) {
            calendarIds.push(id);
        }
    });

    // Создаем экземпляры CalendarManager для каждого id
    calendarIds.forEach(function (id) {
        new CalendarManager(id);
    });
}


// событие "Клик"
document.addEventListener('click', function (event) {
    const target = event.target;
    handleMasterBlockClick(target);
});


// отслеживаем клик по кнопкам внутри мастера
function handleMasterBlockClick(target) {
    const masterBlock = target.closest('.booking_masters_block'); 

    if (!masterBlock) return; 

    if (target.closest('[data-action="select-master"]')) {
        toggleBlocks(masterBlock, '.book_master_block', '.booking_services');
    } else if (target.closest('[data-action="back-to-masters"]')) {

        handleBackToMasters(masterBlock);
    } else if (target.closest('.book_service_text')) {
        handleServiceClick(masterBlock, target.closest('.book_service_text'));
    } else if (target.closest('[data-action="next-to-calendar"]')) {

        handleNextToCalendar(masterBlock);
    } else if (target.closest('[data-action="back-to-services"]')) {

        handleBackToServices(masterBlock);
    } else if (target.classList.contains('day')) {
        handleDayClick(masterBlock, target);
    } else if (target.classList.contains('time')) {
        handleTimeClick(masterBlock, target);
    } else if (target.closest('[data-action="next-to-form"]')) {

        handleNextToForm(masterBlock);
    } else if (target.closest('[data-action="back-to-calendar"]')) {

        toggleBlocks(masterBlock, '.booking_form_section', '.booking_calendar');
    }
}

// Логика возврата к мастерам
function handleBackToMasters(masterBlock) {
    // Снимаем выделение с выбранных сервисов
    masterBlock.querySelectorAll('.book_service_text').forEach(service => {
        const checkbox = service.querySelector('.book_custom_checkbox');
        checkbox.classList.remove('selected');
        service.setAttribute('data-selected', 'false');
    });

    // Очищаем поля формы
    masterBlock.querySelector('input[name="cost"]').value = '';
    masterBlock.querySelector('input[name="duration"]').value = '';
    masterBlock.querySelector('input[name="service"]').value = '';

    toggleBlocks(masterBlock, '.booking_services', '.book_master_block');
}

// Функция обработки клика по услуге
function handleServiceClick(masterBlock, serviceElement) {

    // Снимаем выделение со всех услуг
    masterBlock.querySelectorAll('.book_service_text').forEach(service => {
        const checkbox = service.querySelector('.book_custom_checkbox');
        checkbox.classList.remove('selected');
        service.setAttribute('data-selected', 'false');
    });

    // Выделяем текущий сервис
    const checkbox = serviceElement.querySelector('.book_custom_checkbox');
    checkbox.classList.add('selected');
    serviceElement.setAttribute('data-selected', 'true');
}

// Логика перехода к календарю
function handleNextToCalendar(masterBlock) {

    const selectedService = masterBlock.querySelector('.book_service_text[data-selected="true"]');
    const messageElement = masterBlock.querySelector('.service-selection-message');

    if (!selectedService) {
        if (!messageElement) {
            const newMessageElement = document.createElement('p');
            newMessageElement.classList.add('service-selection-message');
            newMessageElement.textContent = 'Выберите услугу, чтобы продолжить';
            newMessageElement.style.color = 'red';
            masterBlock.querySelector('.book_services_container').appendChild(newMessageElement);
        }
        return;

    } else {
        if (messageElement) {
            messageElement.remove();
        }
    }

    const servicePrice = selectedService.querySelector('[data-price]').textContent;
    const serviceDuration = selectedService.querySelector('[data-duration]').textContent;
    const serviceName = selectedService.querySelector('.book_service_name').textContent;

    masterBlock.querySelector('input[name="cost"]').value = servicePrice + ' руб.';
    masterBlock.querySelector('input[name="duration"]').value = serviceDuration + ' мин.';
    masterBlock.querySelector('input[name="service"]').value = serviceName;

    toggleBlocks(masterBlock, '.booking_services', '.booking_calendar');
}

// Логика возврата к услугам
function handleBackToServices(masterBlock) {

    // Очищаем выбранные дату и время
    masterBlock.querySelector('input[name="date"]').value = '';
    masterBlock.querySelector('input[name="time"]').value = '';

    // Убираем класс .clicked у выбранных дней
    const selectedDays = masterBlock.querySelectorAll('.day.clicked');
    selectedDays.forEach(day => day.classList.remove('clicked'));

    // Убираем класс .clicked у выбранных временных интервалов
    const selectedTimes = masterBlock.querySelectorAll('.time.clicked');
    selectedTimes.forEach(time => time.classList.remove('clicked'));

    // Находим элемент с классом .times и очищаем его содержимое
    const timesContainer = masterBlock.querySelector('.times');
    if (timesContainer) {
        timesContainer.innerHTML = ''; // Удаляем все дочерние элементы

        // Вставляем сообщение о выборе даты
        const messageElement = document.createElement('p');
        messageElement.classList.add('time_message');
        messageElement.textContent = '☝ Выберите дату';
        timesContainer.appendChild(messageElement);
    }

    // Переключаем видимость блоков
    toggleBlocks(masterBlock, '.booking_calendar', '.booking_services');
}


// Функция обработки клика по дню
function handleDayClick(masterBlock, target) {
    // Проверяем, был ли клик на ранее выбранный день
    const previouslyClicked = masterBlock.querySelector('.day.clicked');
    if (previouslyClicked) {
        previouslyClicked.classList.remove('clicked');
    }
    
    // Добавляем класс clicked текущему дню
    target.classList.add('clicked');

    // Проверяем, есть ли у элемента класс 'selected'
    if (target.classList.contains('selected')) {
        check_current_time(masterBlock); // Вызов функции
    }
}

// Функция для проверки текущего времени
function check_current_time(masterBlock) {
    // Получаем текущее время
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    // Форматируем текущее время в строку в формате "HH:MM"
    const formattedCurrentTime = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    // Находим все элементы с атрибутом data-time в блоке ниже masterBlock
    const timeElements = masterBlock.querySelectorAll('.times .time[data-time]');

    timeElements.forEach(function(timeElement) {
        const elementTime = timeElement.getAttribute('data-time');

        // Сравниваем время элемента с текущим временем
        if (elementTime < formattedCurrentTime) {
            // Удаляем элемент, если его время меньше текущего
            timeElement.remove();
        }
    });
}

// Функция обработки клика по времени
function handleTimeClick(masterBlock, target) {
    // Проверяем, что у времени нет класса time_blocked
    if (target.classList.contains('time_blocked')) {
        alert('Это время недоступно 😢 Мастер не успеет ⏰ закончить выбранную Вами услугу до прихода следующего клиента. 🙏 Пожалуйста, выберите другое время или день. 🙂');
        return; // Прерываем выполнение функции
    }

    // Снимаем выделение с ранее выбранного времени
    const previouslyClicked = masterBlock.querySelector('.time.clicked');
    if (previouslyClicked) {
        previouslyClicked.classList.remove('clicked');
    }

    // Добавляем класс clicked к текущему времени
    target.classList.add('clicked');
}


// Логика перехода к форме
function handleNextToForm(masterBlock) {

    const selectedDate = masterBlock.querySelector('.day.clicked');
    const selectedTime = masterBlock.querySelector('.time.clicked');

    if (selectedDate && selectedTime) {
        masterBlock.querySelector('input[name="date"]').value = selectedDate.getAttribute('data-day');
        masterBlock.querySelector('input[name="time"]').value = selectedTime.textContent;

        toggleBlocks(masterBlock, '.booking_calendar', '.booking_form_section');
    } else {
        const timesContainer = masterBlock.querySelector('.times');
        timesContainer.innerHTML = '';
        const messageElement = document.createElement('p');
        messageElement.textContent = 'Выберите дату и время';
        messageElement.style.color = 'red';
        timesContainer.appendChild(messageElement);
    }

}

// Функция для переключения блоков
function toggleBlocks(masterBlock, hideSelector, showSelector) {

    const blockToHide = masterBlock.querySelector(hideSelector);
    const blockToShow = masterBlock.querySelector(showSelector);

    if (blockToHide) blockToHide.classList.add('none');
    if (blockToShow) blockToShow.classList.remove('none');

    if (blockToHide) blockToHide.classList.remove('visible_animation');
    if (blockToShow) blockToShow.classList.add('visible_animation');
}



