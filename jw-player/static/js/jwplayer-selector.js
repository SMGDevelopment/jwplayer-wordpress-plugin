/*
 * currently overblown:
 * -- includes code for managing a list of selected videos
 *    but only used to select a single video, so that list is never visible (and poorly tested) */
const	{ IconButton, Popover, Spinner } = wp.components,
	{ withInstanceId } = wp.compose,
	{ withSelect } = wp.data,
	{ createElement, Component, Fragment } = wp.element,
	{ decodeEntities } = wp.htmlEntities,
	{ UP, DOWN, ENTER } = wp.keycodes,
	{ addQueryArgs } = wp.url,
	el= createElement,
		idPfx= 'jwvideo-selector',
		thumbnailStyle = { 
		borderRadius: '3px', 
		height:'50px', 
		margin: '2px',
		overflow: 'hidden', 
		width: '50px', 
	},
	videoListStyle = { 
		alignItems: 'center', 
		background: '#f9f9f9',
		border: '1px solid #ccc',
		borderRadius: '3px',
		display: 'flex', 
		flexWrap: 'nowrap',
		justifyContent: 'flex-start', 
		marginBottom: '3px',
		padding: '1px',
	},
	debounce= (f, wait= 100)=> {
		let timeout;
		return (...args)=> {
			clearTimeout(timeout);
			timeout= setTimeout(()=> f(...args), wait);
		};
	},
	thumbnailUrl= (key, size= 720)=> `http://content.jwplatform.com/thumbs/${key}-${size}.jpg`,
	createHoc= F=> C=> props=> el(C, {...props, ...F(props)});

class JwSelector extends Component {
	constructor(...args) {
		super(...args);
		this.aborters= {};
		this.bindListNode= this.bindListNode.bind(this);
		this.onChange= this.onChange.bind(this);
		this.onKeyDown= this.onKeyDown.bind(this);
		this.updateSuggestions= debounce(this.updateSuggestions.bind(this), 333);
		this.state= {
			currentSearch: undefined,
			input: '',
			jwSearch: {},
			selectedSuggestion: undefined,
			showSuggestions: false,
		};
		this.suggestionNodes= [];
	}

	bindListNode(ref) {
		this.listNode= ref;
	}

	bindSuggestionNodeFor(index) {
		return ref=> {
			this.suggestionNodes[index]= ref;
		}
	}

	onChange(event) {
		const	input= event.target.value;
		this.setState({input}, ()=> this.updateSuggestions());
	}

	updateSuggestions() {
		const	{input}= this.state, /* typed seach text */
			itMatters= 1<input.length,
			searchId= new Date().getTime();
		this.setState({
				currentSearch: searchId,
				showSuggestions: itMatters,
				selectedSuggestion: undefined,
				loading: itMatters,
			}, () => itMatters && this.search(input)
		)
	}

	search(text) {
		const	{currentSearch}= this.state,
			queryParams= {
				text,
				action: 'jwp_api_proxy',
				method: '/videos/list',
				order_by: 'date:desc',
				random: Math.random(),
				result_limit: this.props.limit || 5,
				token: document.getElementsByName('_wpnonce-widget')[0].value,
			};
		if (this.aborter)
			this.aborter.abort();
		const	controller= this.aborter= new AbortController();
		return fetch(addQueryArgs('/wp-admin/admin-ajax.php', queryParams), {signal: controller.signal})
			.then(response=> response.json())
			.then(jwSearch=> this.setState({
				jwSearch,
				loading: currentSearch != this.state.currentSearch
			})).catch(()=> this.setState({
				loading: currentSearch != this.state.currentSearch
			}))
	}

	componentDidUpdate(){}

	componentWillUnmount(){
		if (this.aborter)
			this.aborter.abort();
	}

	onKeyDown(event) {
		const	{showSuggestions, selectedSuggestion, jwSearch, loading}= this.state;
		if (!showSuggestions || loading || 'ok' !== jwSearch.status || !jwSearch.videos.length)
			return;
		const	vids= jwSearch.videos,
			 N= vids.length;
		event.stopPropagation();
		event.preventDefault();
		switch(event.keyCode) {
			case UP:
				this.setState({
					selectedSuggestion: (selectedSuggestion || N)-1
				});
				break;
			case DOWN:
				this.setState({
					selectedSuggestion: ((x=-1)=> (x+1)%N)(selectedSuggestion)
				});
				break;
			case ENTER:
				if (undefined !== selectedSuggestion) {
					this.selectVideo(vids[selectedSuggestion])
				}
		}
	}

	selectVideo(vid) {
		this.props.onVideoSelect(vid);
		this.setState({
			selectedSuggestion: undefined,
		});
		/* todo: select user's input in browser DOM, so
		 * that it's trivial to type (and search for) something
		 * different (or to clear the search) */
	}

	renderSelectedVideos() {
		const videos= lodash.get(this, 'props.videos');
		if (videos) {
			return el('ul', null,
				...videos.map((vid, i)=>
					el('li', {key:vid.key, style: videoListStyle},
						el('img', {src: thumbnailUrl(vid.key, 40), style: thumbnailStyle}),
						el('span', {style: {flex: 1}},
							vid.title
						),
						el('span', null
							, 0!==i 
								?el(IconButton, {
									style: {display: 'inline-flex', padding: '8px 2px', textAlign: 'center'},
									icon: 'arrow-up-alt2',
									onClick: ()=> {
										this.props.videos.splice(i-1, 0, this.props.videos.splice(i, 1)[0]);
										this.props.onChange(this.props.videos);
										this.setState({rerender: new Date().getTime()});
									}
								})
								:null
							, this.props.videos.length-1 !== i
					 			?el(IconButton, {
									style: {display: 'inline-flex', padding: '8px 2px', textAlign: 'center'},
									icon: 'arrow-down-alt2',
									onClick: ()=> {
										this.props.videos.splice(i+1, 0, this.props.videos.splice(i, 1)[0]);
										this.props.onChange(this.props.videos);
										this.setState({rerender: new Date().getTime()});
									}
								})
								:null
							, el(IconButton, {
								style: {display: 'inline-flex', textAlign: 'center'},
								icon: 'no',
								onClick: ()=> {
									this.props.videos.splice(i, 1);
									this.props.onChange(this.props.videos);
									this.setState({rerender: new Date().getTime()});
								}
							})
						)
					)
				)
			);
		}
	}

	render() {
		const { autoFocus= true, instanceId, limit }= this.props;
		const { showSuggestions, videos= lodash.get(this, 'state.jwSearch.videos'), selectedSuggestion, loading, input }= this.state;
		const inputDisabled= !!limit && limit <= this.props.videos.length;
		return el(Fragment, null,
			this.renderSelectedVideos(),
			el('div', {className: 'jw-videoselector'},
				el('input', {
					'aria-activedescendant': selectedSuggestion &&`${idPfx}-${instanceId}-${selectedSuggestion}`,
					'aria-autocomplete': 'list',
					'aria-expanded': showSuggestions,
					'aria-label': 'URL',
					'aria-owns': `${idPfx}-${instanceId}`,
					autoFocus: autoFocus,
					className: idPfx, 
					disabled: inputDisabled,
					onChange: this.onChange,
					onInput: event=> event.stopPropagation(),
					onKeyDown: this.onKeyDown,
					placeholder: inputDisabled ?`Limited to ${limit} videos` :'Type video name',
					role: 'combobox',
					style: {width: '100%'},
					type: 'text',
					value: input,
				}),
				loading && el('div', null, el(Spinner), 'searching JwPlayer for ', el('i', null, input))
			),
			showSuggestions && videos && !!videos.length &&
				el(Popover, {position: 'bottom', noArrow: 'noArrow', focusOnMount: false},
					el('div', {
						className: `${idPfx}-input-suggestions`,
						id: `${idPfx}-input-suggestions-${instanceId}`,
						ref: this.bindListNode,
						role: 'listbox',
					}, videos.map((vid, i)=> 
						el('button', {
								'aria-selected': i===selectedSuggestion,
								className: `${idPfx}-input-suggestion`+(i===selectedSuggestion ?' is-selected' :''),
								id: `${idPfx}-${instanceId}-${i}`,
								key: vid.key,
								onClick: ()=> this.selectVideo(vid),
								ref: this.bindSuggestionNodeFor(i),
								role: 'option',
								tabIndex: -1,
							},
							el('div', {style: {display: 'flex', alignItems: 'center'}},
								el('img', {src: thumbnailUrl(vid.key, 40), style: thumbnailStyle}),
								el('div', null,
									vid.title || '(no title)'
								)
							)
						)
					))
				)
			)
	}
}

export default withInstanceId(JwSelector);
