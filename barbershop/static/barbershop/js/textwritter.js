// анимация печати текста

document.addEventListener("DOMContentLoaded", function() {
    const textToPrint = " - команда, создавшая этот сайт.";
    const textElement = document.getElementById("textwritter");
    
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function printText(text) {
        for (let index = 0; index < text.length; index++) {
            textElement.innerHTML += text.charAt(index) === ' ' ? '&nbsp;' : text.charAt(index);
            await delay(100);
        }
    
        await delay(5000);
        textElement.innerHTML = ""; 
        await printText(textToPrint); 
    }
    
    async function startPrinting() {
        await delay(1000); 
        await printText(textToPrint);
    }
    
    startPrinting();
    
});
