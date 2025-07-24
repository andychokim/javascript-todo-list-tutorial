/**
 * initial_model is a JS Object with two keys and no methods.
 * it is used both as the "initial" state when mounting the Todo List App
 * and as the "reset" state when all todos are deleted at once.
 */
var initial_model = {
  todos: [], // empty array which we will fill shortly
  hash: "#/" // the hash in the url (for routing)
};

/**
 * `update` transforms the `model` based on the `action`.
 * @param {String} action - the desired action to perform on the model.
 * @param {Object} model - the App's data ("state").
 * @param {String} data - optional data to be added in the update. i.e. item Title.
 * @return {Object} new_model - the updated model.
 */
function update(action, model, data) {
    var new_model = JSON.parse(JSON.stringify(model)); // deep copy
    switch(action) {
        case 'add': // add a new todo item
            new_model.todos.push({
                id: (typeof model.todos !== undefined && model.todos.length > 0 ? model.todos[model.todos.length - 1].id + 1 : 1),
                title: data || document.getElementById('new-todo').value.trim(), // title is the data passed in
                completed: false // new todos are not completed by default
            });

            break;
        case 'toggle': // toggle the completed state of a todo item
            new_model.todos.forEach((item) => { // note: not using `map` here as we are not changing the array, but updating items in it + using {} block since we are not returning a value
                if (item.id == data) {
                    item.completed = !item.completed; // toggle the completed state
                }
            });

            // if all todos are completed, set toggle_all to true
            new_model.toggle_all = new_model.todos.every((item) => item.completed);  
                      
            break;
        case 'toggle-all':
            new_model.toggle_all = !new_model.toggle_all; // toggle the toggle_all state
            new_model.todos.forEach((item) => {
                item.completed = new_model.toggle_all; // set all todos to the toggle_all state
            });

            break;
        case 'delete':
            const index = new_model.todos.findIndex((item) => item.id === data);
            index !== -1 && new_model.todos.splice(index, 1);

            break;
        case 'edit':
            if (new_model.clicked && new_model.clicked === data && Date.now() - 300 < new_model.click_time) {
                new_model.editing = data;
                console.log("second click", "item.id=", data, "| model.editing=", model.editing);
            }
            else { // first click
                new_model.clicked = data;
                new_model.click_time = Date.now();
                new_model.editing = false;
                console.log('first click');
            }

            break;
        case 'save':
            var edit = document.getElementsByClassName('edit')[0];
            var value = edit.value;
            var id = parseInt(edit.id);

            //end editing
            new_model.clicked = false;
            new_model.editing = false;

            if (!value || value.length === 0) { // if saving an empty title
                return update('delete', new_model, id);
            }

            new_model.todos = new_model.todos.map((item) => {
                if (value && value.length > 0 && item.id === id) {
                    item.title = value.trim();
                }
                return item;
            });

            break;
        case 'escape':
            new_model.clicked = false;
            new_model.editing = false;

            break;
        case 'clear-completed':
            new_model.todos = new_model.todos.filter((item) => {
                return !item.completed;
            });

            break;
        case 'route':
            new_model.hash = (window && window.location && window.location.hash) ? window.location.hash : '#/';

            break;
        default: // unknown action
            console.warn('Unknown action:', action);
    }
    return new_model; // return the updated model
};

/* if require is available, it means we are in Node.js Land i.e. testing! */
/* istanbul ignore next */
if (typeof require !== 'undefined' && this.window !== this) {
  var { a, button, div, empty, footer, input, h1, header, label, li, mount,
    route, section, span, strong, text, ul } = require('./elmish.js');
};

/**
 * `render_item` is a function that creates a DOM tree with a single ToDo List item
 * using the elmish DOM functions (`li`, `div`, `input`, `label` and `button`)
 * returns an `<li>` HTML element with a nested `<div>` which in turn has the:
 *   `<input type=checkbox>` which lets users to "Toggle" the status of the item
 *   `<label>` which displays the Todo item text (`title`) in a `<text>` node
 *   `<button class="destroy">` lets people "delete" a todo item.
 * @param  {Object} item the todo item object
 * @return {Object} <li> DOM Tree which is nested in the <ul>.
 * @example 
 * // returns <li> DOM element with <div>, <input>. <label> & <button> nested
 * var DOM = render_item({id: 1, title: "Build Todo List App", completed: false});
 */
function render_item(item, model, signal) {
    return (
        li(["data-id=" + item.id, "id=" + item.id, item.completed ? "class=completed" : model && model.editing && model.editing === item.id ? "class=editing" : ""], 
            [
                div(["class=view"],
                    [
                        input([item.completed ? "checked=true" : "", "class=toggle", "type=checkbox", typeof signal === 'function' ? signal('toggle', item.id) : ''], 
                            []
                        ),
                        label([typeof signal === 'function' ? signal('edit', item.id) : ''], 
                            [text(item.title)]
                        ),
                        button(["class=destroy", typeof signal === 'function' ? signal('delete', item.id) : ''])
                    ]
                ), // div
            ].concat(model && model.editing && model.editing === item.id ? [
                input(["class=edit", "id=" + item.id, "value=" + item.title, "autofocus"])
            ] : [])
        ) // li
    );
};

/**
 * `render_main` is a function that creates the main view of the Todo List App.
 * It uses the `elmish` DOM functions to create a `<section>` with a header,
 * and `render_item` for each todo item in the model.
 * @param  {Object} model the App's data ("state") with a `todos` array
 * @return {Object} <section> DOM Tree which is the main view of the Todo List App.
 * @example
 * // returns <section> DOM element with a header and a list of todo items
 *  var DOM = render_main({
 *      todos: [
 *          {id: 1, title: "Build Todo List App1", completed: true},
 *          {id: 2, title: "Build Todo List App2", completed: false}
 *      ],
 *      hash: "#/"
 *  });
 */
function render_main(model, signal) {
    return(
        section(
            ["class=main", "id=main", "style=display:" + (model.todos.length > 0 ? "block" : "none")],
            [
                input(["id=toggle-all", "type=checkbox", model.toggle_all ? "checked=true": "", "class=toggle-all", signal('toggle-all')], 
                    []
                ),
                label(["for=toggle-all"], 
                    [text("Mark all as complete")]
                ),
                ul(["class=todo-list"],
                    (model.todos && model.todos.length > 0) ?
                    model.todos.filter((item) => {
                        switch (model.hash) {
                            case '#/active':
                                return item.completed === false;
                            case '#/completed':
                                return item.completed === true;
                            default:
                                return item;
                        }
                    }).map((item) => render_item(item, model, signal)) 
                    : null
                ) // ul
            ] // section
        )
    );
};

/**
 * `render_footer` renders the `<footer class="footer">` element of the Todo List App.
 * It uses the `elmish` DOM functions to create a footer with:
 * - a `<span>` showing the number of items left
 * - a `<ul>` with filters for "All", "Active", and "Completed" 
 * - a `<button>` to clear completed items.
 * @param {Object} model the App's data ("state") with a `todos` array
 * @return {Object} <footer> DOM Tree which is the footer of the Todo List App.
 * @example
 * // returns <footer> DOM element with a span, ul and button
 *   var DOM = render_footer(model);
 */
function render_footer(model, signal) {
    var leftCount = 0;
    var doneCount = 0;
    model.todos.forEach((item) => item.completed === false ? leftCount++ : doneCount++); // count items based on their completed state
    return (
        footer(
            ["class=footer", "id=footer", "style=display:" + (model.todos.length > 0 ? "block" : "none")],
            [
                span(["class=todo-count", "id=count"], 
                    [
                        strong(leftCount.toString()),
                        text(" item" + (leftCount === 1 ? '' : 's') + " left")
                    ]
                ),
                ul(["class=filters"],
                    [
                        li([], 
                            [
                                a(["href=#/", "id=all", "class=" + (model.hash === '#/' ? "selected" : "")], 
                                    [text("All")]
                                )
                            ]
                        ),
                        li([],
                            [
                                a(["href=#/active", "id=active", "class=" + (model.hash === '#/active' ? "selected" : "")], 
                                    [text("Active")]
                                )
                            ]
                        ),
                        li([],
                            [
                                a(["href=#/completed", "id=completed", "class=" + (model.hash === '#/completed' ? "selected" : "")], 
                                    [text("Completed")]
                                )
                            ]
                        )
                    ]
                ),
                button(["class=clear-completed", "style=display:" + (model.todos.filter((item) => item.completed).length > 0 ? "block" : "none"), 
                    typeof signal === 'function' ? signal('clear-completed') : ''],
                    [
                        text("Clear completed ["),
                        span(["id=completed-count"],
                            [text(doneCount)]
                        ),
                        text("]")
                    ]
                )
            ]
        )
    );
};

/**
 * `view` renders the entire Todo List App
 * which contains count of items to (still) to be done and a `<ul>` "menu"
 * with links to filter which todo items appear in the list view.
 * @param {Object} model - the App's (current) model (or "state").
 * @return {Object} <section> DOM Tree which containing all other DOM elements.
 * @example
 * // returns <section class="todo-app"> DOM element with other DOM els nested:
 * var DOM = view(model);
 */
function view(model, signal) {
    return (
        section(["class=todoapp"],
            [
                header(["class=header"],
                    [
                        h1([],
                            [text("todos")]
                        ),
                        input(["id=new-todo", "class=new-todo", "placeholder=What needs to be done?", "autofocus=true"])
                    ]
                ),
                render_main(model, signal), // render the main view
                render_footer(model, signal) // render the footer view
            ]
        )
    );
};

/**
 * `subscriptions` is a function that sets up event listeners for the Todo List App.
 * @param signal - the event signal to subscribe to.
 */
function subscriptions(signal) {
    document.addEventListener('keyup', (event) => {
        switch(event.key) {
            case 'Enter':
                // if adding
                var input = document.getElementById('new-todo');
                if (input.value.length > 0) { // only add if input is not empty
                    signal('add')(); // send the add action with the input value
                    input.value = ''; // clear the input field
                    document.getElementById('new-todo').focus();
                }

                // if editing
                var editing = document.getElementsByClassName('editing');
                if (editing && editing.length > 0) {
                    signal('save')();
                }

                break;
            case 'Escape':
                signal('escape')();
                
                break;
        }
    });
    window.onhashchange = function route () {
        signal('route')();
    };
}


/* module.exports is needed to run the functions using Node.js for testing! */
/* istanbul ignore next */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    model: initial_model,
    update: update,
    render_item: render_item,
    render_main: render_main,
    render_footer: render_footer,
    view: view,
    subscriptions: subscriptions
  };
};
