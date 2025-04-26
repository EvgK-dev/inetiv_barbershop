// короткий слайдер

document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.main_block');
    const dots = document.querySelectorAll('.dot_main');
    let currentSlide = 0;
    let slideInterval = setInterval(nextSlide, 4000); 
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function goToSlide(n) {
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');

        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentSlide].classList.add('active');
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            goToSlide(index);
            slideInterval = setInterval(nextSlide, 4000); 
        });
    });

    goToSlide(currentSlide); 
});
