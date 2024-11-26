document.addEventListener('DOMContentLoaded', () => {
    const orderSummary = document.getElementById('order-summary');
    const orderDetails = document.getElementById('order-details');
    const totalCostBlock = document.getElementById('total-cost');
    const totalCostValue = document.getElementById('total-cost-value');
    const orderForm = document.getElementById('orderForm');
    const apiKey = '23d05351-a6d2-48ec-8e3b-fcd6081fd307'; // Замените на ваш API Key

    let dishes = [];
    let selectedDishes = {
        soup: null,
        mainCourse: null,
        salad: null,
        drink: null,
        dessert: null
    };

    // Функция для загрузки блюд с API
    async function loadDishes() {
        try {
            const response = await fetch(`https://edu.std-900.ist.mospolytech.ru/api/dishes?api_key=${apiKey}`);
            if (!response.ok) {
                throw new Error('Ошибка при загрузке блюд');
            }
            dishes = await response.json();
            loadSelectedDishesFromLocalStorage();
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка при загрузке блюд');
        }
    }

    // Функция для загрузки выбранных блюд из localStorage
    function loadSelectedDishesFromLocalStorage() {
        const savedDishIds = JSON.parse(localStorage.getItem('selectedDishes'));
        if (savedDishIds) {
            savedDishIds.forEach(dishId => {
                const dish = dishes.find(d => d.id === dishId);
                if (dish) {
                    const category = dish.category === 'main-course' ? 'mainCourse' : dish.category;
                    selectedDishes[category] = dish;
                }
            });
            updateOrderSummary();
            updateOrderDetails();
        }
    }

    // Функция для обновления сводки заказа
    function updateOrderSummary() {
        orderSummary.innerHTML = '';
        let totalCost = 0;

        if (!Object.values(selectedDishes).some(dish => dish)) {
            orderSummary.innerHTML = '<p>Ничего не выбрано. Чтобы добавить блюда в заказ, перейдите на страницу <a href="lab2.html">Собрать ланч</a>.</p>';
            totalCostBlock.style.display = 'none';
            return;
        }

        Object.entries(selectedDishes).forEach(([category, dish]) => {
            const categoryName = {
                soup: 'Суп',
                mainCourse: 'Главное блюдо',
                salad: 'Салат',
                drink: 'Напиток',
                dessert: 'Десерт'
            }[category];

            if (dish) {
                const div = document.createElement('div');
                div.classList.add('order-item');
                div.innerHTML = `<h4>${categoryName}</h4><p>${dish.name} ${dish.price}₽</p><button class="btn" data-dish="${dish.id}">Удалить</button>`;
                orderSummary.appendChild(div);
                totalCost += parseInt(dish.price);
            }
        });

        totalCostValue.textContent = `${totalCost}₽`;
        totalCostBlock.style.display = 'block';
    }

    // Функция для обновления деталей заказа
    function updateOrderDetails() {
        orderDetails.innerHTML = '';

        Object.entries(selectedDishes).forEach(([category, dish]) => {
            const categoryName = {
                soup: 'Суп',
                mainCourse: 'Главное блюдо',
                salad: 'Салат',
                drink: 'Напиток',
                dessert: 'Десерт'
            }[category];

            const div = document.createElement('div');
            div.classList.add('order-item');
            div.innerHTML = `<h4>${categoryName}</h4><p>${dish ? `${dish.name} ${dish.price}₽` : 'Не выбрано'}</p>`;
            orderDetails.appendChild(div);
        });
    }

    // Функция для удаления блюда из заказа
    function removeDishFromOrder(dishId) {
        const dish = dishes.find(d => d.id === dishId);
        if (dish) {
            const category = dish.category === 'main-course' ? 'mainCourse' : dish.category;
            selectedDishes[category] = null;
            updateOrderSummary();
            updateOrderDetails();
            saveSelectedDishesToLocalStorage();
        }
    }

    // Функция для сохранения выбранных блюд в localStorage
    function saveSelectedDishesToLocalStorage() {
        const selectedDishIds = Object.entries(selectedDishes)
            .filter(([category, dish]) => dish !== null)
            .map(([category, dish]) => dish.id);
        localStorage.setItem('selectedDishes', JSON.stringify(selectedDishIds));
    }

    // Обработчик события для кнопки "Удалить"
    orderSummary.addEventListener('click', event => {
        if (event.target.classList.contains('btn')) {
            const dishId = event.target.getAttribute('data-dish');
            removeDishFromOrder(dishId);
        }
    });

    // Функция для отображения уведомления
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <p>${message}</p>
            <button>Окей 👌</button>
        `;
        document.body.appendChild(notification);

        notification.querySelector('button').addEventListener('click', () => {
            closeNotification(notification);
        });
    }

    // Функция для закрытия уведомления
    function closeNotification(notification) {
        notification.remove();
    }

    // Добавляем обработчик события для формы
    orderForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!validateOrder()) {
            return;
        }

        const formData = new FormData(orderForm);
        formData.append('soup_id', selectedDishes.soup ? selectedDishes.soup.id : '');
        formData.append('main_course_id', selectedDishes.mainCourse ? selectedDishes.mainCourse.id : '');
        formData.append('salad_id', selectedDishes.salad ? selectedDishes.salad.id : '');
        formData.append('drink_id', selectedDishes.drink ? selectedDishes.drink.id : '');
        formData.append('dessert_id', selectedDishes.dessert ? selectedDishes.dessert.id : '');

        try {
            const response = await fetch(`https://edu.std-900.ist.mospolytech.ru/api/orders?api_key=${apiKey}`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error('Ошибка при отправке заказа');
            }
            const result = await response.json();
            showNotification('Заказ успешно оформлен!');
            localStorage.removeItem('selectedDishes');
            window.location.href = 'lab2.html';
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка при отправке заказа');
        }
    });

    // Функция для проверки выбранных блюд
    function validateOrder() {
        const selectedDishesArray = Object.values(selectedDishes).filter(dish => dish !== null);

        if (selectedDishesArray.length === 0) {
            showNotification('Ничего не выбрано. Выберите блюда для заказа');
            return false;
        }

        const hasSoup = selectedDishesArray.some(dish => dish.category === 'soup');
        const hasMainCourse = selectedDishesArray.some(dish => dish.category === 'main-course');
        const hasSalad = selectedDishesArray.some(dish => dish.category === 'salad');
        const hasDrink = selectedDishesArray.some(dish => dish.category === 'drink');

        if (!hasDrink) {
            showNotification('Выберите напиток');
            return false;
        }

        if (hasSoup && !hasMainCourse && !hasSalad) {
            showNotification('Выберите главное блюдо/салат/стартер');
            return false;
        }

        if ((hasSalad || hasMainCourse) && !hasSoup && !hasMainCourse) {
            showNotification('Выберите суп или главное блюдо');
            return false;
        }

        if (hasDrink && !hasMainCourse) {
            showNotification('Выберите главное блюдо');
            return false;
        }

        return true;
    }

    loadDishes();
});
