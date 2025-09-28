// Script to update all hyperlinks to point to #
document.addEventListener('DOMContentLoaded', function() {
    // Get all anchor tags
    const links = document.querySelectorAll('a[href]');
    
    // Update each link to point to #
    links.forEach(function(link) {
        if (link.href && !link.href.includes('#')) {
            link.href = '#';
        }
    });
    
    // Prevent default behavior for all links
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            return false;
        });
    });
});