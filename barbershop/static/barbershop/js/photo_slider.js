// большой слайдер

class Slider {
    constructor(sliderElement, leftButton, rightButton) {
      this.sliderElement = sliderElement;
      this.pagination = sliderElement.nextElementSibling;
      this.currentIndex = 0;
      this.startX = 0;
      this.isDragging = false;
      this.autoSlideTimeout;

      //
      if (!leftButton || !rightButton) {
          console.error('Не найдены кнопки переключения слайдов');
      }

      this.leftButton = leftButton;
      this.rightButton = rightButton;

      this.init();
    }
  
    init() {
      this.createPagination();
      this.updateSlider();
      this.updatePagination();
  
      this.sliderElement.addEventListener('mousedown', this.handleDragStart.bind(this));
      this.sliderElement.addEventListener('touchstart', this.handleDragStart.bind(this));
      document.addEventListener('mouseup', this.handleDragEnd.bind(this));
      document.addEventListener('touchend', this.handleDragEnd.bind(this));
      document.addEventListener('mousemove', this.handleDragMove.bind(this));
      document.addEventListener('touchmove', this.handleDragMove.bind(this));

      //
      this.leftButton.addEventListener('click', this.goToPreviousSlide.bind(this));
      this.rightButton.addEventListener('click', this.goToNextSlide.bind(this));

      this.startAutoSlide();
    }
  
    createPagination() {
      const dots = this.sliderElement.children.length;
  
      for (let i = 0; i < dots; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        dot.addEventListener('click', () => this.goToSlide(i));
        this.pagination.appendChild(dot);
      }
    }
  
    updateSlider() {
      this.sliderElement.style.transform = `translateX(${-this.currentIndex * 340}px)`;
    }
  
    updatePagination() {
      const dots = this.pagination.children;
  
      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('active', i === this.currentIndex);
      }
    }
  
    goToSlide(index) {
      if (index >= 0 && index < this.sliderElement.children.length) {
        this.currentIndex = index;
        this.updateSlider();
        this.updatePagination();
      }
    }

    goToPreviousSlide() {
      if (this.currentIndex > 0) {
        this.goToSlide(this.currentIndex - 1);
      }
    }

    goToNextSlide() {
      if (this.currentIndex < this.sliderElement.children.length - 1) {
        this.goToSlide(this.currentIndex + 1);
      }
    }
  
    handleDragStart(e) {
      e.preventDefault();
      this.isDragging = true;
      this.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    }
  
    handleDragEnd() {
      this.isDragging = false;
    }
  
    handleDragMove(e) {
      if (!this.isDragging) return;
  
      const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - this.startX;
  
      if (deltaX > 50 && this.currentIndex > 0) {
        this.goToPreviousSlide();
        this.startX = currentX;
      } else if (deltaX < -50 && this.currentIndex < this.sliderElement.children.length - 1) {
        this.goToNextSlide();
        this.startX = currentX;
      }
    }
  
    startAutoSlide() {
      this.autoSlideTimeout = setTimeout(() => {
        const nextIndex = (this.currentIndex + 1) % this.sliderElement.children.length;
        this.goToSlide(nextIndex);
        this.startAutoSlide();
      }, 10000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const sliderElement = document.getElementById('slider');
    const leftButton = document.getElementById('photo_slider_line_left');
    const rightButton = document.getElementById('photo_slider_line_right');

    if (sliderElement && leftButton && rightButton) {
        new Slider(sliderElement, leftButton, rightButton);
    } else {
        console.error('Слайдер или кнопки не найдены в DOM');
    }
});
