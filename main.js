document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';

    // 초기 테마 설정
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateToggleIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const targetTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
        updateToggleIcon(targetTheme);
    });

    function updateToggleIcon(theme) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
});
