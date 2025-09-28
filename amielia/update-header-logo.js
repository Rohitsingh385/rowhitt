// Script to replace header logo with letter A
document.addEventListener('DOMContentLoaded', function() {
    const logoLinks = document.querySelectorAll('.qodef-header-logo-link, .qodef-mobile-header-logo-link');
    
    logoLinks.forEach(function(logoLink) {
        logoLink.innerHTML = '<span style="color: #F8BBD9; font-size: 42px; font-weight: bold; font-family: cursive;">Amiliea</span>';
    });
});