const books = [];
const RENDER_EVENT = 'render-book';
const SAVED_EVENT = 'saved-book';
const STORAGE_KEY = 'BOOKSHELF_APPS';

function isStorageExist() {
    if (typeof (Storage) === undefined) {
        alert('Browser kamu tidak mendukung local storage');
        return false;
    }
    return true;
}

function makeId() {
    return new Date().getTime();
}

function makeBook(id, title, author, year, isComplete) {
    return {
        id,
        title,
        author,
        year,
        isComplete
    }
}

function getBook(bookId) {
    for (const book of books) {
        if (book.id === bookId) {
            return book;
        }
    }
    return null;
}

function getBookIndex(bookId) {
    for (const index in books) {
        if (books[index].id === bookId) {
            return index;
        }
    }
    return -1;
}

function addNewBook() {
    const title = document.getElementById('bookFormTitle').value;
    const author = document.getElementById('bookFormAuthor').value;
    const year = parseInt(document.getElementById('bookFormYear').value);
    const isComplete = document.getElementById('bookFormIsComplete').checked;

    const id = makeId();
    const book = makeBook(id, title, author, year, isComplete);
    books.push(book);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBooks();
}

function toggleDone(bookId) {
    const bookTarget = getBook(bookId);

    if (bookTarget == null) return;

    bookTarget.isComplete = !bookTarget.isComplete;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBooks();
}

function deleteBook(bookId) {
    const bookTargetIndex = getBookIndex(bookId);
    if (bookTargetIndex === -1) return;

    books.splice(bookTargetIndex, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBooks();
}

function editBookInfo(bookId) {
    const bookTarget = getBook(bookId);
    if (bookTarget == null) return;

    const bookContainer = document.querySelector(`[data-bookid='${bookId}']`);
    if (bookContainer.querySelector('.inline-edit')) return;

    const editForm = document.createElement('form');
    editForm.classList.add('inline-edit');
    editForm.innerHTML = `
        <input type="text" name="title" value="${bookTarget.title}" required>
        <input type="text" name="author" value="${bookTarget.author}" required>
        <input type="number" name="year" value="${bookTarget.year}" required>
        <button type="submit">Simpan</button>
        <button type="button" class="cancel-edit">Batal</button>`;

    editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        bookTarget.title = editForm.title.value.trim();
        bookTarget.author = editForm.author.value.trim();
        bookTarget.year = parseInt(editForm.year.value);
        document.dispatchEvent(new Event(RENDER_EVENT));
        saveBooks();
    });

    editForm.querySelector('.cancel-edit').addEventListener('click', function () {
        editForm.remove();
    });

    bookContainer.append(editForm);
}

function createBookElement(bookObject) {
    const textTitle = document.createElement('h3');
    textTitle.innerText = bookObject.title;
    textTitle.setAttribute('data-testid', 'bookItemTitle');

    const textAuthor = document.createElement('p');
    textAuthor.innerText = `Penulis: ${bookObject.author}`;
    textAuthor.setAttribute('data-testid', 'bookItemAuthor');

    const textYear = document.createElement('p');
    textYear.innerText = `Tahun: ${bookObject.year}`;
    textYear.setAttribute('data-testid', 'bookItemYear');

    const container = document.createElement('div');
    container.setAttribute('data-bookid', bookObject.id);
    container.setAttribute('data-testid', 'bookItem');
    container.append(textTitle, textAuthor, textYear);

    const buttonContainer = document.createElement('div');

    const toggleButton = document.createElement('button');
    toggleButton.innerText = bookObject.isComplete ? 'Belum selesai dibaca' : 'Selesai dibaca';
    toggleButton.setAttribute('data-testid', 'bookItemIsCompleteButton');
    toggleButton.addEventListener('click', function () {
        toggleDone(bookObject.id);
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Hapus Buku';
    deleteButton.setAttribute('data-testid', 'bookItemDeleteButton');
    deleteButton.addEventListener('click', function () {
        deleteBook(bookObject.id);
    });

    const editButton = document.createElement('button');
    editButton.innerText = 'Edit Buku';
    editButton.setAttribute('data-testid', 'bookItemEditButton');
    editButton.addEventListener('click', function () {
        editBookInfo(bookObject.id);
    });

    buttonContainer.append(toggleButton, deleteButton, editButton);
    container.append(buttonContainer);

    return container;
}

function saveBooks() {
    if (isStorageExist()) {
        const parsed = JSON.stringify(books);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

function loadBooksFromStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (serializedData == null) return;

    const data = JSON.parse(serializedData);

    if (data !== null) {
        for (const book of data) {
            books.push(book);
        }
    }

    document.dispatchEvent(new Event(RENDER_EVENT));
}

document.addEventListener('DOMContentLoaded', function () {
    const submitForm = document.getElementById('bookForm');
    submitForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addNewBook();
        submitForm.reset();
    });

    const checkBox = document.getElementById('bookFormIsComplete');
    const submitButtonSpan = document.querySelector('#bookFormSubmit span');

    checkBox.addEventListener('change', function () {
        if (checkBox.checked) {
            submitButtonSpan.innerText = 'Selesai dibaca';
        } else {
            submitButtonSpan.innerText = 'Belum selesai dibaca';
        }
    });

    const searchForm = document.getElementById('searchBook');
    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const searchTitle = document.getElementById('searchBookTitle').value.toLowerCase();
        const filteredBooks = books.filter(book => book.title.toLowerCase().includes(searchTitle));

        renderFilteredBooks(filteredBooks);
    });

    if (isStorageExist()) {
        loadBooksFromStorage();
    }
});

document.addEventListener(RENDER_EVENT, function () {
    const incompleteBookList = document.getElementById('incompleteBookList');
    const completeBookList = document.getElementById('completeBookList');

    incompleteBookList.innerHTML = '';
    completeBookList.innerHTML = '';

    for (const book of books) {
        const bookElement = createBookElement(book);
        if (book.isComplete) {
            completeBookList.append(bookElement);
        } else {
            incompleteBookList.append(bookElement);
        }
    }
});

function renderFilteredBooks(filteredBooks) {
    const incompleteBookList = document.getElementById('incompleteBookList');
    const completeBookList = document.getElementById('completeBookList');

    incompleteBookList.innerHTML = '';
    completeBookList.innerHTML = '';

    for (const book of filteredBooks) {
        const bookElement = createBookElement(book);
        if (book.isComplete) {
            completeBookList.append(bookElement);
        } else {
            incompleteBookList.append(bookElement);
        }
    }
}
