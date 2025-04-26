// анимация появления элементов при прокрутке страницы - сверху, снизу, справа, слева

function onEntry(entry) {
    entry.forEach(change => {
        // Проверяем, находится ли элемент в области видимости (intersecting)
        if (change.isIntersecting) {
            // Если элемент виден, добавляем ему класс 'element-show'
            change.target.classList.add('element-show');
        }
    });
}

// Значение 0.1 означает, что элемент будет считаться видимым, если хотя бы 10% его площади находится в области видимости экрана.
let options = { threshold: [0.03] };

let observer = new IntersectionObserver(onEntry, options);

let animations = [
    '.animation-bottom-to-up', 
    '.animation-right-to-left', 
    '.animation-left-to-right', 
    '.animation-top-to-bottom'
];

animations.forEach(animationClass => {
    let elements = document.querySelectorAll(animationClass);
    for (let elm of elements) {
        observer.observe(elm);
    }
});
