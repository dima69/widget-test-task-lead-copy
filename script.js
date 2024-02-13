define(['jquery'], function ($) {
	var CustomWidget = function () {
		let self = this;
		let settings, w_code;
		let style = '\
		<style id="widget-lead-copy-custom-style">\
			.widget-lead-copy {\
				background-color: #214168;\
			}\
			.widget-lead-copy .card-widgets__widget__caption__logo {\
				color: #E4E4E4;\
				font-weight: bold;\
				display: block;\
				transform: translate(20px, 12px);\
				height: 0;\
				margin-left: 0;\
				padding: 0;\
			}\
			.widget-lead-copy .card-widgets__widget__caption__logo_min {\
				color: #E4E4E4;\
				font-weight: bold;\
				display: block;\
				transform: translate(17px, 12px);\
				width: 0;\
				padding: 0;\
			}\
			.my-custom-widget-lead-copy .control--select--list-opened {\
				box-sizing: border-box;\
				left: 0;\
			}\
			.my-custom-widget-lead-copy .selector-title {\
				padding-top: 10px;\
			}\
			.my-copy-lead__info {\
				margin-top: 10px;\
				text-align: center;\
				cursor: default;\
			}\
			.my-copy-lead__info_load {\
				color: orange;\
			}\
			.my-copy-lead__info_error {\
				color: red;\
			}\
			.my-copy-lead__info_success {\
				color: green;\
			}\
			.my-copy-lead__button_disable {\
				cursor: not-allowed;\
			}\
			.my-copy-lead__button {\
				margin-top: 10px;\
				text-align: center;\
				border: 1px solid #D4D5D8;\
				border-radius: 3px;\
				padding: 5px;\
				transition: 0.3s;\
			}\
			.my-copy-lead__button:hover {\
				background-color: #FBFAFB;\
			}\
		</style>';

		function replaceTextInSelectorButton(element, new_text) {
			$(element).find('.control--select--button').text(new_text);
		}

		this.callbacks = {
			render: function () {
				if ($('#widget-lead-copy-custom-style').length == 0) {
					$('head').append(style);
				}

				self.render_template({
					caption: {
						class_name: 'widget-lead-copy',
						html: ''
					},
					body: '',
					render: '\
					<div class="my-custom-widget-lead-copy">\
						<p class="selector-title">Воронка:</p>\
						<div class="control--select linked-form__select select-pipeline">\
							<ul class="custom-scroll control--select--list">\
								<li data-value="" class="control--select--list--item control--select--list--item-selected">\
									<span class="control--select--list--item-inner" title="Выбрать">\
										Выбрать\
									</span>\
								</li>\
							</ul>\
							\
							<button class="control--select--button" type="button" data-value="" style="border-bottom-width: 1px; background-color: #fff;">\
								<span class="control--select--button-inner">\
									Выбрать\
								</span>\
							</button>\
							\
							<input type="hidden" class="control--select--input" name="select-pipeline" value="" data-prev-value="">\
						</div>\
						<div class="my-copy-lead__button my-copy-lead__button_disable">Скопировать</div>\
						<p class="my-copy-lead__info"></p>\
					</div>'
				});

				// Кнопка выбора воронки
				let pipelineSelector = $('.my-custom-widget-lead-copy .select-pipeline');

				let statuses;
				let pipelines = {};
				$.ajax({
					method: 'GET',
					url: '/api/v4/leads/pipelines',
					dataType: 'json',
					beforeSend: function () {
						replaceTextInSelectorButton(pipelineSelector, 'Загрузка списка воронок...');
					},
					error: function () {
						replaceTextInSelectorButton(pipelineSelector, 'Ошибка');
					},
					success: function (data) {
						replaceTextInSelectorButton(pipelineSelector, 'Выбрать');
						// @@@ if (data._embedded.pipelines.length == 0)

						// prepare data
						data._embedded.pipelines.forEach(pipeline => {
							let pipeline_statuses = pipeline['_embedded']['statuses'];
							let pipeline_id = pipeline['id']
							pipelines[pipeline_id] = {
								name: pipeline['name'],
								statuses: {}
							};
							pipeline_statuses.forEach(status => {
								// .replace(/\s/g, '') - убирает пробелы в строке (???)
								if (status.name.replace(/\s/g, '') != 'Неразобранное')
									pipelines[pipeline['id']]['statuses'][status['id']] = status['name'];
							});
						});

						// fill pipeline selector
						for (let id in pipelines) {
							let str = `
							<li data-value="${id}" class="control--select--list--item">\
								<span class="control--select--list--item-inner" title="${pipelines[id]['name']}">\
									${pipelines[id]['name']}\
								</span>\
							</li>`;
							$(str).appendTo('.my-custom-widget-lead-copy .select-pipeline .custom-scroll');
						}
					}
				});

				// Выбор воронки
				$('[name="select-pipeline"]').on('change', function (e) {
					// Сбросим результат предыдущей задачи копирования
					$('.my-copy-lead__info')
						.removeClass('my-copy-lead__info_load my-copy-lead__info_success my-copy-lead__info_error')
						.text(null);

					let selected_pipeline = $(this).val();
					$('.my-copy-lead__button').addClass('my-copy-lead__button_disable');
					if (selected_pipeline == '') {
						replaceTextInSelectorButton($(this).parent(), 'Выбрать');
					} else {
						// selected_pipeline - id выбранной воронки
						replaceTextInSelectorButton($(this).parent(), pipelines[selected_pipeline]['name']);
					}

					let $input = $(e.currentTarget)
					console.log($input.val())
					let status_id = $(this).val();
					if (status_id == "") {
						$('.my-custom-widget-lead-copy .select-status').prev().remove();
						$('.my-custom-widget-lead-copy .select-status').remove();
						return;
					}
					if ($('.my-custom-widget-lead-copy .select-status').length == 0) {
						$(pipelineSelector).after('\
						<p class="selector-title">Этап:</p>\
						<div class="control--select linked-form__select select-status">\
							<ul class="custom-scroll control--select--list">\
								<li data-value="" class="control--select--list--item control--select--list--item-selected">\
									<span class="control--select--list--item-inner" title="Выбрать">\
										Выбрать\
									</span>\
								</li>\
							</ul>\
							\
							<button class="control--select--button" type="button" data-value="" style="border-bottom-width: 1px; background-color: #fff;">\
								<span class="control--select--button-inner">\
									Выбрать\
								</span>\
							</button>\
							\
							<input type="hidden" class="control--select--input " name="select-status" value="" data-prev-value="">\
						</div>');
					}
					if ($('.my-custom-widget-lead-copy .select-status .control--select--list--item').length > 1) {
						$('.my-custom-widget-lead-copy .select-status .control--select--list--item:not(:first-child').remove();
						$('.my-custom-widget-lead-copy .select-status .control--select--list--item').addClass('control--select--list--item-selected');
						replaceTextInSelectorButton('.my-custom-widget-lead-copy .select-status', 'Выбрать');
						$('[name="select-status"]').val('');
					}

					statuses = pipelines[status_id]['statuses'];
					for (let id in statuses) {
						let str = `
						<li data-value="${id}" class="control--select--list--item">\
							<span class="control--select--list--item-inner" title="${statuses[id]}">\
								${statuses[id]}\
							</span>\
						</li>`;
						$(str).appendTo('.my-custom-widget-lead-copy .select-status .custom-scroll');
					}
				});

				// Выбор статуса из выбранной ранее воронки
				$('.my-custom-widget-lead-copy').on('change', '[name="select-status"]', function () {
					// Сбросим результат предыдущей задачи копирования
					$('.my-copy-lead__info')
						.removeClass('my-copy-lead__info_load my-copy-lead__info_success my-copy-lead__info_error')
						.text(null);
				
					let selected_status = $(this).val();
					if (selected_status == '') {
						replaceTextInSelectorButton($(this).parent(), 'Выбрать');
						$('.my-copy-lead__button').addClass('my-copy-lead__button_disable');
					} else {
						replaceTextInSelectorButton($(this).parent(), statuses[selected_status]);
						$('.my-copy-lead__button').removeClass('my-copy-lead__button_disable');
					}
				});

				// "idle" "error" "loading" "success"
				let copyTaskStatus = "idle";

				$('.my-copy-lead__button').on('click', function () {
					// Если "кнопка"(div) "отключена", то сразу выйдем из ивента
					if ($(this).hasClass('my-copy-lead__button_disable')) return;

					let pipeline_id = Number($('.my-custom-widget-lead-copy [name="select-pipeline"]').val())
					let	status_id = Number($('.my-custom-widget-lead-copy [name="select-status"]').val())

					// Объект AMOCRM признан устаревшим, использовать APP
					// https://www.amocrm.ru/developers/content/web_sdk/env_variables
					// @@@ fallback
					let lead_id = APP.data.current_card.id;
					copyTaskStatus = "idle";

					// Получаем всю информацию по текущей сделке
					$.ajax({
						method: 'GET',
						url: '/api/v4/leads/' + lead_id + '?with=contacts',
						async: false,
						dataType: 'json',
						beforeSend: function () {
							copyTaskStatus = "loading";
						},
						error: function () {
							copyTaskStatus = "error";
						},	
						success: function (data) {
							let current_lead = data;

							let new_lead_data = {
								account_id: current_lead.account_id,
								closed_at: current_lead.closed_at,
								closest_task_at: current_lead.closest_task_at,
								created_at: current_lead.created_at,
								created_by: current_lead.created_by,
								custom_fields_values: current_lead.custom_fields_values,
								group_id: current_lead.group_id,
								is_deleted: current_lead.is_deleted,
								labor_cost: current_lead.labor_cost,
								pipeline_id: pipeline_id,
								price: current_lead.price,
								name: current_lead.name,
								responsible_user_id: current_lead.responsible_user_id,
								score: current_lead.score,
								status_id: status_id,
								updated_at: current_lead.updated_at,
								updated_by: current_lead.updated_by,
							}
							// Отправим сделку в выбранную воронку и выбранный статус в воронке
							$.ajax({
								method: 'POST',
								url: '/api/v4/leads',
								async: false,
								dataType: 'json',
								data: JSON.stringify([new_lead_data]),
								error: function (error) {
									copyTaskStatus = "error";
									console.log("Error in: /api/v4/leads/", error)
								},	
								success: function (data) {
									console.log("POST /api/v4/leads:", data);
									let newly_created_lead_id = data._embedded.leads[0].id
									// Теперь линковка
									$.ajax({
										method: 'GET',
										url: '/api/v4/leads/'+lead_id+"/links",
										async: false,
										dataType: 'json',
										error: function () {
											copyTaskStatus = "error";
										},	
										success: function (data) {
											console.log(`GET /api/v4/leads/${lead_id}/links:`, data)
											// Ну нужно делать линковку если ничего нет изначально
											if (!data._embedded.links || data._embedded.links.length == 0) {
												copyTaskStatus = "success";
												console.log("выходим")
												return;
											}
											data._embedded.links.forEach(obj => {
												// В API просят "is_main" вместо "main_contact", поэтому переименовываем
												if (obj.metadata && obj.metadata.hasOwnProperty("main_contact")) {
														obj.metadata.is_main = obj.metadata.main_contact;
														delete obj.metadata.main_contact;
												}
											});
											// Теперь POST
											$.ajax({
												method: 'POST',
												url: '/api/v4/leads/'+newly_created_lead_id+"/link",
												async: false,
												dataType: 'json',
												data: JSON.stringify(data._embedded.links),
												error: function (error) {
													copyTaskStatus = "error";
													console.log(error);
												},	
												success: function (data) {
													copyTaskStatus = "success";
													console.log(`POST /api/v4/leads/${lead_id}/links:`, data)
												}
											});		
										}
									});
		
								}
							});
						}
					});

					switch (copyTaskStatus) {
						case "idle":
							$('.my-copy-lead__info')
								.removeClass('my-copy-lead__info_load my-copy-lead__info_success my-copy-lead__info_error')
								.text(null);
							break;
						case "loading":
							$('.my-copy-lead__info')
								.addClass('my-copy-lead__info_load')
								.text('Загрузка..');	
							break;					
						case "error":
							$('.my-copy-lead__info')
								.removeClass('my-copy-lead__info_load my-copy-lead__info_success')
								.addClass('my-copy-lead__info_error')
								.text('Ошибка');
							break;
						case "success":
							$('.my-copy-lead__info')
								.removeClass('my-copy-lead__info_load my-copy-lead__info_error')
								.addClass('my-copy-lead__info_success')
								.text('Готово!');
							break;	
						default:
							break;
					}
				});

				$('.widget-lead-copy img').remove();
				$('.widget-lead-copy span').first().after('\
					<span class="card-widgets__widget__caption__logo">Копирование сделок</span>\
					<span class="card-widgets__widget__caption__logo_min">Копи</span>\
				');

				// styles
				setInterval(() => {
					if ($('.card-widgets.js-widgets-active').length > 0) {
						$('.widget-lead-copy .card-widgets__widget__caption__logo').show();
						$('.widget-lead-copy .card-widgets__widget__caption__logo_min').hide();
					} else {
						$('.widget-lead-copy .card-widgets__widget__caption__logo').hide();
						$('.widget-lead-copy .card-widgets__widget__caption__logo_min').show();
					}
				}, 100);

				$('.my-custom-widget-lead-copy').parent().css({
					'background-color': '#fff'
				});
				return true;
			},
			init: function () {
				settings = self.get_settings();
				w_code = settings.widget_code;
				return true;
			},
			bind_actions: function () {
				return true;
			},
			settings: function () {
				return true;
			},
			onSave: function () {
				return true;
			},
			destroy: function () {},
			advancedSettings: function () {
				return true;
			},
			contacts: {
				selected: function () {}
			},
			leads: {
				selected: function () {}
			},
			tasks: {
				selected: function () {}
			}
		};

		return this;
	}
	return CustomWidget;
});
