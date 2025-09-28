// Script to update slider text content
document.addEventListener('DOMContentLoaded', function() {
    const titles = document.querySelectorAll('.qodef-m-title');
    const newTexts = [
        'things i<br /> <span class="qodef--custom">like?</span>',
        '<span class="qodef--custom">cooking</span>',
        'HI, I\'m<br /> <span class="qodef--custom">Nur Amielia</span>',
        '<span class="qodef--custom">doodling!</span>',
        '<span class="qodef--custom">singing</span>'
    ];
    
    titles.forEach(function(title, index) {
        if (index < newTexts.length) {
            title.innerHTML = newTexts[index];
        }
    });
});