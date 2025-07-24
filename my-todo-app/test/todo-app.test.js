const test = require('tape');       // https://github.com/dwyl/learn-tape
const fs = require('fs');           // to read html files (see below)
const path = require('path');       // so we can open files cross-platform
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
require('jsdom-global')(html);      // https://github.com/rstacruz/jsdom-global
const app = require('../lib/todo-app.js'); // functions to test
const id = 'test-app';              // all tests use 'test-app' as root element
const elmish = require('../lib/elmish.js'); // import "elmish" core functions

/**
 * Model initialization tests
 */
test('model 1: todo `model` (Object) has desired keys', (t) => {
    const model_keys = Object.keys(app.model);

    t.equal(model_keys.length, 2, 'model has 2 keys');
    t.deepEqual(model_keys, ['todos', 'hash'], 'model has correct keys');
    t.end();
});

test('model 2: todo `model` (Object) has correct initial values', (t) => {
    const model = JSON.parse(JSON.stringify(app.model)); // deep copy

    t.true(Array.isArray(app.model.todos), 'model.todos is an array');
    t.equal(model.todos.length, 0, 'model.todos is an empty array');
    t.equal(model.hash, '#/', 'model.hash is "#/"');
    t.end();
});


/**
 * Update function tests
 */
test('update 1: default should return model the same', (t) => {
    let model = JSON.parse(JSON.stringify(app.model)); // deep copy
    const expected = JSON.parse(JSON.stringify(app.model)); // deep copy

    model = app.update('default', model);

    t.deepEqual(model, expected, 'model should remain unchanged');
    t.end();
});

test('update 2: add should update the model by adding a todo item correctly', (t) => {
    let model = JSON.parse(JSON.stringify(app.model)); // deep copy
    const data = 'New Todo'; // data to be added
    const expected_todo = {
        id: 1, // first item should have id 1
        title: data, // title should be the data passed in
        completed: false // new todos are not completed by default
    };

    model = app.update('add', model, data);
    
    t.equal(model.todos.length, 1, 'model.todos should have been updated to have 1 item');
    t.deepEqual(model.todos[0], expected_todo, 'model.todos should have been added correctly');
    t.end();
});

test('update 3: toggle should switch the completed boolean of a todo item', (t) => {
    let model = JSON.parse(JSON.stringify(app.model)); // deep copy

    model = app.update('add', model, 'New Todo');
    model = app.update('toggle', model, model.todos[0].id); // toggle the first todo
    
    t.equal(model.todos[0].completed, true, 'model.todos should have been toggled correctly');

    model = app.update('toggle', model, model.todos[0].id); // toggle the first todo again

    t.equal(model.todos[0].completed, false, 'model.todos should have been toggled correctly');
    t.end();
});

// this is used for testing view functions which require a signal function
function mock_signal () {
  return function inner_function() {
    console.log('done');
  }
}

/**
 * Render function tests
 */
test('render 1: render_item HTML for a single ToDo Item', (t) => {
    const model = {
        todos: [
            { id: 1, title: 'Test Todo', completed: true }
        ],
        hash: '#/'
    };

    document.getElementById(id).appendChild(app.render_item(model.todos[0])); // render the item into the test app element

    const completed = document.querySelectorAll('.completed')[0].textContent; // get the text content of the first completed item
    t.equal(completed, 'Test Todo', 'render_item should return the correct HTML for a completed todo item');

    const checked = document.querySelectorAll('input')[0].checked; // get the checked state of the first input
    t.equal(checked, true, 'render_item should set the input checked state for completed todo item');

    elmish.empty(document.getElementById(id)); // clear the test app element
    t.end();
});

test('render 2: render_main view using (elmish) HTML DOM functions', (t) => {
    const model = {
        todos: [
            { id: 1, title: "Learn Elm Architecture", completed: true },
            { id: 2, title: "Build Todo List App",    completed: false },
            { id: 3, title: "Win the Internet!",      completed: false }
        ],
        hash: '#/'
    };

    document.getElementById(id).appendChild(app.render_main(model, mock_signal)); // render the main view into the test app element

    document.querySelectorAll('.view').forEach((item, index) => {
        t.equal(item.textContent, model.todos[index].title, `render_main should return the correct HTML for todo item ${index + 1}`);
    });

    const inputs = document.querySelectorAll('input');
    [true, false, false].forEach((state, index) => {
        t.equal(inputs[index+1].checked, state, `render_main should set the input checked state for todo item ${index + 1}`);
    });

    elmish.empty(document.getElementById(id)); // clear the test app element
    t.end();
})

test('render 3: render_footer should return the correct HTML for the footer', (t) => {
    const model = {
        todos: [
            { id: 1, title: "Learn Elm Architecture", completed: true },
            { id: 2, title: "Build Todo List App",    completed: false },
            { id: 3, title: "Win the Internet!",      completed: false }
        ],
        hash: '#/'
    };

    document.getElementById(id).appendChild(app.render_footer(model)); // render the footer into the test app element

    document.querySelectorAll('.footer').forEach((footer) => {
        t.equal(footer.tagName.toLowerCase(), 'footer', 'render_footer should return a footer element');
    })

    const itemsLeft = document.querySelectorAll('.todo-count')[0].textContent;
    t.equal(itemsLeft, '2 items left', 'render_footer should show the correct number of items left');

    const filters = ['All', 'Active', 'Completed'];
    const hrefs = ['#/', '#/active', '#/completed'];
    document.querySelectorAll('a').forEach((a, index) => {
        t.equal(a.textContent, filters[index], `render_footer should have the correct text for ${filters[index]} filter`);
        t.equal(a.href.replace('about:blank', ''), hrefs[index], `render_footer should have the correct href for ${filters[index]} filter`);
    });

    const clearButton = document.querySelectorAll('.clear-completed')[0].textContent;
    t.equal(clearButton, 'Clear completed [1]', 'render_footer should have a clear completed button');

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    t.end();
});

test('render 4: view should render the entire Todo List App using "partials"', (t) => {
    document.getElementById(id).appendChild(app.view(app.model, mock_signal)); // render the entire "initial" app into the test app element

    const mainSection = document.querySelectorAll('.todoapp')[0];
    t.equal(mainSection.tagName.toLowerCase(), 'section', 'view should return a section element with class "todoapp"');

    const header = document.getElementsByTagName('h1')[0].textContent;
    t.equal(header, 'todos', 'view should have a header with text "todos"');

    const placeholder = document.querySelectorAll('.new-todo')[0].placeholder;
    t.equal(placeholder, 'What needs to be done?', 'view should have an input with placeholder "What needs to be done?"');

    const mainlist = document.querySelectorAll('.todo-list')[0].innerHTML;
    t.equal(mainlist, '', 'view should have an empty todo list initially');

    const footerCount = document.querySelectorAll('.todo-count')[0].innerHTML;
    t.equal(footerCount, '<strong>0</strong> items left', 'view should show "0 items left" in the footer');

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    t.end();
});

/**
 * User Interaction tests
 */
test('user 1: No Todos, should hide #main and #footer', (t) => {
    // render the view and append it to the DOM inside the `test-app` node:
    document.getElementById(id).appendChild(app.view({todos: []}, mock_signal)); // No Todos

    const main_display = window.getComputedStyle(document.getElementById('main'));
    t.equal('none', main_display._values.display, "No Todos, hide #main");

    const main_footer= window.getComputedStyle(document.getElementById('footer'));
    t.equal('none', main_footer._values.display, "No Todos, hide #footer");

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    t.end();
});


// Testing localStorage requires "polyfil" because:
// https://github.com/jsdom/jsdom/issues/1137 ¯\_(ツ)_/¯
// globals are usually bad! but a "necessary evil" here.
global.localStorage = global.localStorage ? global.localStorage : {
    getItem: function(key) {
        const value = this[key];
        return typeof value === 'undefined' ? null : value;
    },
    setItem: function (key, value) {
        this[key] = value;
    },
    removeItem: function (key) {
        delete this[key]
    }
}
localStorage.removeItem('todos-elmish_store');

test('user 2: `add` should allow user to add todo items', (t) => {
    // render the view and append it to the DOM inside the `test-app` node:
    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    elmish.mount({todos: []}, app.update, app.view, id, app.subscriptions); // mount the app with an empty model

    const new_todo = document.getElementById('new-todo');
    const todo_text = "Make Everything Awesome!       ";
    new_todo.value = todo_text; // set the value of the input
    document.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter'})); // simulate pressing "Enter" key

    const items = document.querySelectorAll('.view');
    t.equal(items.length, 1, 'should have 1 todo item after adding a new one');

    const item_text = items[0].textContent.trim(); // get the text content of the first item
    t.equal(item_text, todo_text.trim(), 'should have added the new todo item with correct text(trimmed)');

    const clone = document.getElementById(id).cloneNode(true); // clone the test app element
    new_todo.dispatchEvent(new KeyboardEvent('keyup', {key: '-'})); // simulate pressing "-" key
    t.deepEqual(document.getElementById(id), clone, 'should not add a todo item when "-" key is pressed'); // check that the DOM has not changed

    t.equal(new_todo.value, '', 'should clear the input after adding a todo item'); // check that the input is cleared

    const main_display = window.getComputedStyle(document.getElementById('main'));
    t.equal('block', main_display._values.display, "should show #main when there is at least 1 todo item");

    const main_footer = window.getComputedStyle(document.getElementById('footer'));
    t.equal('block', main_footer._values.display, "should show #footer when there is at least 1 todo item");

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('user 3: `toggle_all` should allow user to mark all as completed', (t) => {
    const model = {
        todos: [
            { id: 1, title: "Learn Elm Architecture", completed: true },
            { id: 2, title: "Build Todo List App", completed: false },
            { id: 3, title: "Win the Internet!", completed: false }
        ],
        hash: '#/'
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions); // mount the app with the model

    // check that the "toggle all" checkbox is present and unchecked
    const items = document.querySelectorAll('.view');
    document.querySelectorAll('.toggle').forEach(function(item, index) {
        t.equal(item.checked, model.todos[index].completed, `item ${index + 1} should be initialized correctly`);
    })

    // simulate clicking the "toggle all" checkbox => false --> true
    document.getElementById('toggle-all').click(); 
    t.equal(document.getElementById('toggle-all').checked, true, '"toggle all" checkbox should be checked');
    document.querySelectorAll('.toggle').forEach((item, index) => {
        t.equal(item.checked, true, `item ${index + 1} should be marked as completed`); // check that all items are marked as completed
    })

    // simulate clicking the "toggle all" checkbox again => true --> false
    document.getElementById('toggle-all').click(); 
    t.equal(document.getElementById('toggle-all').checked, false, '"toggle all" checkbox should be unchecked');
    document.querySelectorAll('.toggle').forEach((item, index) => {
        t.equal(item.checked, false, `should be marked as NOT completed for item ${index + 1}`); // check that all items are marked as NOT completed
    })

    // manually toggle each item
    document.querySelectorAll('.toggle').forEach((item, index) => {
        item.click(); // toggle the item
        t.equal(item.checked, true, `should be marked as completed for item ${index + 1}`); // check that the item is marked as completed
    });
    t.equal(document.getElementById('toggle-all').checked, true, '"toggle all" checkbox should be checked once all items are marked as completed');

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('user 4: `check complete/incomplete` should allow user to mark items as complete/incomplete', (t) => {
    const model = {
        todos: [
            { id: 1, title: "Learn Elm Architecture", completed: false }
        ],
        hash: '#/'
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions); // mount the app with the model

    t.equal(document.getElementById('1').textContent, model.todos[0].title, 'item should be rendered with correct title');

    t.equal(document.querySelectorAll('.toggle')[0].checked, model.todos[0].completed, 'item should be rendered with correct completed state');

    // clicking the checkbox should toggle the completed state
    document.querySelectorAll('.toggle')[0].click(); // toggle the item
    t.equal(document.querySelectorAll('.toggle')[0].checked, !model.todos[0].completed, 'item should be marked as completed after clicking the checkbox');

    // clicking the checkbox again should toggle the completed state back
    document.querySelectorAll('.toggle')[0].click(); // toggle the item again
    t.equal(document.querySelectorAll('.toggle')[0].checked, model.todos[0].completed, 'item should be marked as NOT completed after clicking the checkbox again');

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('user 5: `delete` should allow user to delete items', (t) => {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: false },
            { id: 2, title: "test2", completed: false }
        ],
        hash: '#/'
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions); // mount the app with the model

    t.equal(document.querySelectorAll('.view').length, 2, 'there should be 2 todo items');
    t.equal(document.querySelectorAll('.destroy').length, 2, 'there should be 2 delete buttons');

    document.getElementById('1').querySelectorAll('button.destroy')[0].click(); // click the destroy button of the first item
    t.equal(document.getElementById('1'), null, 'todo item 1 should have been deleted');
    t.true(document.getElementById('2'), 'todo item 2 should still be there');
    t.equal(document.querySelectorAll('.destroy').length, 1, 'there should be only 1 delete button');

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('user 6.1: `edit` check onclick editing status', (t) => {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: false },
            { id: 2, title: "test2", completed: false },
            { id: 3, title: "test3", completed: false }
        ],
        hash: '#/',
        editing: 2 // editing item.id=2
    };

    // render the ONE todo list item in "editing mode" based on model.editing:
    document.getElementById(id).appendChild(app.render_item(model.todos[1], model, mock_signal));

    // test if the signal is onclick attribute
    t.equal(document.querySelectorAll('.view > label')[0].onclick.toString(), mock_signal().toString(), "mock_signal is onclick attribute of label");

    // test <li class="editing"> and <input class="edit"> was rendered
    t.equal(document.querySelectorAll('.editing').length, 1, "editing class exits properly");
    t.equal(document.querySelectorAll('.edit').length, 1, "edit class exists properly");

    // test <input class="edit" is autofocused and showing properly
    t.equal(document.querySelectorAll('.edit')[0].value, model.todos[1].title, "edit class is added properly");

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end()
});

test('user 6.2: `edit` double-click <index> for signalling "onclick" behavior', (t) => {
    const model = {
        todos: [
            { id: 0, title: "test1", completed: false },
            { id: 1, title: "test2", completed: false },
            { id: 2, title: "test3", completed: false }
        ],
        hash: '#/'
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    const label = document.querySelectorAll('.view > label')[1];

    // fast clicks
    label.click();
    label.click();

    t.equal(document.querySelectorAll('.editing').length, 1, "<class=editing> is visible after double-clicking");
    t.equal(document.querySelectorAll('.edit')[0].value, model.todos[1].title, "<class=edit> is visible after double-clicking");
    
    elmish.empty(document.getElementById(id));
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end()
});

test('user 6.2.1: `edit` double-clicking past 300ms of interval period', (t) => {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: false },
            { id: 2, title: "test2", completed: false },
            { id: 3, title: "test3", completed: false }
        ],
        hash: '#/'
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    const label = document.querySelectorAll('.view > label')[1];

    // slow clicks
    label.click();
    setTimeout(() => {
        label.click();
        t.equal(document.querySelectorAll('.editing').length, 0, "should not enter editing mode when double-clicked past 300ms")

        elmish.empty(document.getElementById(id));
        localStorage.removeItem('todos-elmish_' + id); // clear localStorage
        t.end();
    }, 301);
});

test('user 6.3: `edit` should be able to save the edit by pressing Enter while editing', (t) => {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: false },
            { id: 2, title: "test2", completed: false },
            { id: 3, title: "test3", completed: false }
        ],
        hash: '#/',
        editing: 1 // editing item.id===1
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    const new_title = "new_test    1       ";
    document.querySelectorAll('.edit')[0].value = new_title;
    t.equal(document.querySelectorAll('.edit').length, 1, "edit class exists properly"); // confirm the app is under the edit mode

    document.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter'})); // pressing "Enter" while in edit mode

    const label = document.querySelectorAll('.view > label')[0].textContent; // fetching the title after Enter
    t.equal(label, new_title.trim(), "title of the item is saved properly");

    elmish.empty(document.getElementById(id));
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('user 6.3.1: `edit` should instead delete the item if saving an empty text to it', (t) => {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: false },
            { id: 2, title: "test2", completed: false },
            { id: 3, title: "test3", completed: false }
        ],
        hash: '#/',
        editing: 1 // editing item.id===1
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    const empty_title = "";
    document.querySelectorAll('.edit')[0].value = empty_title;
    t.equal(document.querySelectorAll('.edit').length, 1, "edit class exists properly"); // confirm the app is under the edit mode

    document.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter'})); // pressing "Enter" while in edit mode

    const item = document.getElementById('1'); // fetching the title after Enter
    t.false(item, "title of the item is deleted properly");
    t.equal(document.querySelectorAll('.view').length, 2, "the rest of the unedited items stay the same");

    elmish.empty(document.getElementById(id));
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('user 6.4: `edit` should be able to leave the editing mode without changes by pressing ESC', (t) => {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: false },
            { id: 2, title: "test2", completed: false },
            { id: 3, title: "test3", completed: false }
        ],
        hash: '#/',
        editing: 1 // editing item.id===1
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    const new_title = "new_test1";
    document.querySelectorAll('.edit')[0].value = new_title;
    t.equal(document.querySelectorAll('.edit').length, 1, "edit class exists properly"); // confirm the app is under the edit mode

    document.dispatchEvent(new KeyboardEvent('keyup', {key: 'Escape'})); // pressing "Enter" while in edit mode

    t.equal(document.querySelectorAll('.edit').length, 0, "edit mode exited properly"); // confirm the app is no longer under the edit mode
    t.equal(document.getElementById('1').textContent, model.todos[0].title, "title of the item is not changed"); // fetching the title after Enter

    elmish.empty(document.getElementById(id));
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('user 7: `clear_completed` should be able to see how many items are completed', (t) => {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: true },
            { id: 2, title: "test2", completed: true },
            { id: 3, title: "test3", completed: false }
        ],
        hash: '#/',
        editing: 1 // editing item.id===1
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    const completed_count = parseInt(document.getElementById('completed-count').textContent);
    t.equal(completed_count, model.todos.filter((item) => item.completed).length, "displays completed items count accurately");

    const button = document.getElementsByClassName('clear-completed')[0];
    button.click(); // click the button

    t.equal(document.querySelectorAll('.view').length, 1, "completed items are gone");
    t.false(document.querySelectorAll('.view').completed, "left item is incompleted");
    t.equal(document.querySelectorAll('clear-completed').length, 0, "the button should not be available when no items are completed");

    elmish.empty(document.getElementById(id));
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('8. Persistence > should persist its data', function (t) {
    const model = {
        todos: [
            { id: 0, title: "Make something people want.", completed: false }
        ],
        hash: '#/'
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    // confirm that the model is saved to localStorage   
    console.log('localStorage', localStorage.getItem('todos-elmish_' + id));

    t.equal(localStorage.getItem('todos-elmish_' + id), JSON.stringify(model), "data is persisted to localStorage");

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});

test('8. Persistence > should persist its data', function (t) {
    const model = {
        todos: [
            { id: 1, title: "test1", completed: true },
            { id: 2, title: "test2", completed: true },
            { id: 3, title: "test3", completed: false }
        ],
        hash: '#/active'
    };
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    // test "active" filtered status
    t.equal(document.querySelectorAll('.selected')[0].id, 'active', '<id=active> should have been selected');
    t.equal(document.querySelectorAll('.view').length, 1, 'only the incompleted items are rendered');

    // reset
    elmish.empty(document.getElementById(id));
    localStorage.removeItem('todos-elmish_' + id);
    model.hash = '#/completed';
    elmish.mount(model, app.update, app.view, id, app.subscriptions);
    
    // test "completed" filtered status
    t.equal(document.querySelectorAll('.selected')[0].id, 'completed', '<id=completed> should have been selected');
    t.equal(document.querySelectorAll('.view').length, 2, 'only the completed items are rendered');

    // reset
    elmish.empty(document.getElementById(id));
    localStorage.removeItem('todos-elmish_' + id);
    model.hash = '#/';
    elmish.mount(model, app.update, app.view, id, app.subscriptions);

    // test "all" filtered status
    t.equal(document.querySelectorAll('.selected')[0].id, 'all', '<id=all> should have been selected');
    t.equal(document.querySelectorAll('.view').length, 3, 'all items are rendered');

    elmish.empty(document.getElementById(id)); // clear DOM ready for next test
    localStorage.removeItem('todos-elmish_' + id); // clear localStorage
    t.end();
});
