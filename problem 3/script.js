document.getElementById('new-note').addEventListener('click', function() {
  const note = new Note();
  document.getElementById('notes').appendChild(note.element);
});

class Subscription {
  constructor() {
      this.callbacks = [];
  }

  add(callback) {
      this.callbacks.push(callback);
  }

  remove(callback) {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
          this.callbacks.splice(index, 1);
      }
  }

  unsubscribe() {
      this.callbacks.forEach(callback => callback());
      this.callbacks = [];
  }
}

class Note {
  constructor(parent = null) {
      this.parent = parent;
      this.children = [];
      this.subscription = new Subscription();
      if (this.parent) {
          this.parent.children.push(this);
          this.parent.subscription.add(() => this.delete());
      }
      this.element = this.render();
  }

  render() {
      const element = document.createElement('div');
      const input = document.createElement('input');
      const addButton = document.createElement('button');
      addButton.textContent = 'Add Note';
      addButton.addEventListener('click', () => {
          const child = this.addChild();
          child.element.textContent = input.value;
          element.appendChild(child.element);
          input.value = '';
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete Note';
      deleteButton.addEventListener('click', () => {
          this.delete();
      });

      element.appendChild(input);
      element.appendChild(addButton);
      element.appendChild(deleteButton);
      return element;
  }

  
  addChild() {
      const child = new Note(this);
      this.children.push(child);
      return child;
  }

  delete() {
      // Delete all child notes
      this.children.forEach(child => child.delete());

      if (this.parent) {
          const index = this.parent.children.indexOf(this);
          if (index > -1) {
              this.parent.children.splice(index, 1);
          }
          this.parent.subscription.remove(() => this.delete());
      }
      this.subscription.unsubscribe();
      if (this.element) {
          this.element.remove();
      }
  }
}