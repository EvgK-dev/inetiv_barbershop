// проверка бронирования

function fetchRecordData() {
    console.log('Старт ');
    const phoneInput = document.getElementById('phone-input').value;
    const resultMessage = document.getElementById('result-message');

    resultMessage.innerHTML = '';
    resultMessage.classList.remove('error', 'hidden');

    if (phoneInput.length !== 6 || isNaN(phoneInput)) {
        resultMessage.innerHTML = 'Введите 6 цифр';
        resultMessage.classList.add('error'); 
        resultMessage.classList.remove('hidden'); 
        return;
    }

    resultMessage.innerHTML = 'Ожидание обработки запроса...';
    resultMessage.classList.remove('hidden');

    fetch(`/verify_record/?phone=${phoneInput}`, {
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
        if (data.success && data.bookings && data.bookings.length > 0) {
            const booking = data.bookings[0];
            resultMessage.innerHTML = `Дата: ${booking.date}<br>Время: ${booking.time}<br>Мастер: ${booking.master}<br>Услуга: ${booking.service}`;
            resultMessage.classList.remove('error'); 
        } else {
            resultMessage.innerHTML = 'Запись не найдена.';
            resultMessage.classList.add('error'); 
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        resultMessage.innerHTML = 'Произошла ошибка при проверке записи.';
        resultMessage.classList.add('error'); 
    });
}


document.getElementById('check-button').addEventListener('click', fetchRecordData);
