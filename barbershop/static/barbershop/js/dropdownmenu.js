// аккордеон для блока FAQ

document.addEventListener('DOMContentLoaded', function() {
    const questions = document.querySelectorAll('.question_conteiner');

    questions.forEach(function(question) {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;

            answer.classList.toggle('active');

            const plusElement = this.querySelector('.plus');
            if (plusElement) {
                plusElement.classList.toggle('rotated-element');
            }
        });
    });
});