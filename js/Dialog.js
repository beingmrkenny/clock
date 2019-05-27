class Dialog {

	constructor (header, content, action) {
		var self = this;

		self.id = $html.getIdFromString(header);

		var clock = new Clock();
		clock.globalVariables.setItem('dialogAction', action);

		if (arguments.length === 1) {

			self.dialog = qid(self.id);

		} else {

			let contentString = (typeof content == 'string') ? `<p>${content}</p>` : '';

			self.dialog = $dom.createElement(`
				<dialog open id="${self.id}">
					<form method="dialog">
						<h2>${header}</h2>
						${contentString}
						<p class="buttons">
							<button type="reset" data-action="cancel">Cancel</button>
							<button type="submit" data-action="ok">OK</button>
						</p>
					</form>
				</dialog>`);

			if (content instanceof HTMLElement) {
				let form = self.dialog.firstElementChild;
				form.insertAfter(content, form.firstElementChild);
			}

			self.dialog.addEventListener('reset', Dialog.reset);
			Mousetrap.bind('esc', Dialog.reset);

			self.dialog.addEventListener('submit', Dialog.submit);
			Mousetrap.bind('enter', Dialog.submit);

			document.body.appendChild(self.dialog);
		}

	}

	static reset () {
		Mousetrap.unbind(['enter', 'esc']);
		q('dialog').remove();
	}

	static submit () {
		var self = this;
		var clock = new Clock();
		var action = clock.globalVariables.getItem('dialogAction');
		action();
		clock.globalVariables.delete('dialogAction');
		Dialog.reset();
	}

}
