// создание яндекс карты

document.addEventListener('DOMContentLoaded', () => {

    const yandexMapHTML = `
        <a href="https://yandex.by/maps/213/moscow/?utm_medium=mapframe&utm_source=maps" style="color:#eee;font-size:12px;position:absolute;top:0px;">Москва</a>
        <a href="https://yandex.by/maps/geo/moskva/53166393/?ll=37.675321%2C55.754392&utm_medium=mapframe&utm_source=maps&z=12.48" style="color:#eee;font-size:12px;position:absolute;top:14px;">Москва — Яндекс Карты</a>
        <iframe src="https://yandex.by/map-widget/v1/?ll=37.675321%2C55.754392&mode=poi&poi%5Bpoint%5D=37.617306%2C55.755696&poi%5Buri%5D=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1MzE2NjM5MxIa0KDQvtGB0YHQuNGPLCDQnNC-0YHQutCy0LAiCg14eBZCFfUFX0I%2C&z=12.48" width="300" height="200" frameborder="1" allowfullscreen="true" style="position:relative;"></iframe>
    `;

    const yanMapsBlock = document.querySelector('.yan_maps');
    if (yanMapsBlock) {
        yanMapsBlock.innerHTML = yandexMapHTML;
    }

});

