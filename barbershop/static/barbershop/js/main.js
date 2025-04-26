//Menu БУРГЕР 

let unlock = true; 
const header__burger = document.querySelector(".header__burger"); 

if (header__burger != null) {
	const header__menu = document.querySelector(".header__menu"); 
	const body = document.querySelector("body"); 

	header__burger.addEventListener("click", function (e) {
		if (unlock) {
            body_lock(); 
			header__burger.classList.toggle("_active"); 
			header__menu.classList.toggle("_active"); 
		}
	});

	header__menu.addEventListener("click", function() {
		if (body.classList.contains('_lock')) { 
			body.classList.remove("_lock"); 
		}
		header__burger.classList.remove("_active");
		header__menu.classList.remove("_active");
	});
};

// блокировка скролла

function body_lock() {
    let body = document.querySelector("body"); 
    if (body.classList.contains('_lock')) { 
        body.classList.remove("_lock"); 
    } else {
        body.classList.add("_lock");
    }
}


// скрытие/появление хедера при прокрутке

const header = document.querySelector('.header'); 
let lastScroll = 0;
const defaultOffset = 60; 

const scrollPosition = () => window.pageYOffset || document.documentElement.scrollTop; 
const containHide = () => header.classList.contains('hide'); 

window.addEventListener('scroll', () => { 
  if (scrollPosition() > lastScroll && !containHide() && scrollPosition() > defaultOffset) {
    header.classList.add('hide');  
  } else if (scrollPosition() < lastScroll && containHide()) {
    header.classList.remove('hide'); 
  }

  lastScroll = scrollPosition();
})


// рекламное объявление

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const offerBlock = document.createElement('div');
        const linkAnchor = document.createElement('a');

        offerBlock.classList.add('unique_offer_block_843');
        linkAnchor.classList.add('unique_anchor_843');

        linkAnchor.innerHTML = `
            <span class="unique_color_blue_843">iNetiV.com</span>
            <span class="unique_color_white_843"> - создали этот сайт. </span>
            <span class="unique_color_green_843">Кликни :)</span>
        `;
        linkAnchor.href = 'https://inetiv.com/';
        linkAnchor.style.textDecoration = 'none';

        offerBlock.appendChild(linkAnchor);

        document.querySelector('.main').appendChild(offerBlock);

        //
        const style = document.createElement('style');
        style.innerHTML = `
            .unique_offer_block_843 {
                width: 250px;
                padding: 10px 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid #01FEEA;
                border-radius: 10px;
                box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
                color: #ffffff;
                text-align: center;
                font-size: clamp(16px, 2vw, 1.2rem);
                position: fixed;
                bottom: -100px;
                right: 10px; /* Устанавливаем правый край на 10px от края экрана */
                z-index: 1000;
                opacity: 0;
                transition: all 0.8s ease;
            }

            .unique_offer_block_843.show {
                opacity: 1;
                bottom: 70%;
            }

            .unique_anchor_843 {
                letter-spacing: 2px;
                transition: color 0.3s ease;
            }

            .unique_color_blue_843 {
                color: #01FEEA; /* Бирюзовый цвет */
            }

            .unique_color_white_843 {
                color: #ffffff; /* Белый цвет */
            }

            .unique_color_green_843 {
                color: rgb(22, 218, 80); /* Зеленый цвет */
            }

            /* Медиазапрос для экранов шириной менее 800px */
            @media (max-width: 800px) {
                .unique_offer_block_843 {
                    width: 210px; /* Уменьшаем ширину блока на меньших экранах */
                    padding: 10px; /* Уменьшаем отступы для компактности */
                }

                .unique_offer_block_843.show {
                    bottom: 80%;
                }
            }
        `;
        document.head.appendChild(style);

        // 
        setTimeout(() => {
            offerBlock.classList.add('show');
            setTimeout(() => {
                offerBlock.style.transition = 'all 0.8s ease';
                offerBlock.style.bottom = '150%';
                offerBlock.style.opacity = '0';
            }, 8000);
        }, 2000);
    }, 15000); 
});
