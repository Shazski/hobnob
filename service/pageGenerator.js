module.exports = {
    generatePageNumbers:(userCount) => {
        let totalPages = Math.ceil(userCount / 10)
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }
}