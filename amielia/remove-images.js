// Script to replace images with custom sequence
document.addEventListener('DOMContentLoaded', function() {
    // Hide all img tags except custom ones
    const images = document.querySelectorAll('img');
    images.forEach(function(img) {
        img.style.display = 'none';
    });
    
    // Replace background images with custom sequence
    const bgImageElements = document.querySelectorAll('.qodef-m-bg-inner');
    const customImages = ['../../images/1.jpg', '../../images/2.jpg', '../../images/3.jpg', '../../images/4.jpg', '../../images/5.jpg'];
    
    bgImageElements.forEach(function(element, index) {
        if (index < customImages.length) {
            element.style.backgroundImage = 'url(' + customImages[index] + ')';
            element.style.backgroundSize = 'cover';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'center';
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    });
});