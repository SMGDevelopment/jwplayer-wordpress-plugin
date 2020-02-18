const	{ IconButton, Popover, Spinner } = wp.components,
	{ withInstanceId } = wp.compose,
	{ createElement, Component } = wp.element,
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
	thumbnailUrl= (key, size= 720)=> `http://content.jwplatform.com/thumbs/${key}-${size}.jpg`,
	debounce= (f, wait= 100)=> {
		let timeout;
		return (...args)=> {
			clearTimeout(timeout);
			timeout= setTimeout(()=> f(...args), wait);
		};
	},
	createHoc= F=> C=> props=> el(C, {...props, ...F(props)}); /* TODO? refactor search method as hook and introduce to JwSelector as hoc */

export default class JwSelector extends Component {
	constructor(...args) {
		super(...args);
		this.aborters= {};
		this.bindListNode= this.bindListNode.bind(this);
		this.instanceId= new Date().getTime();
		this.onChange= this.onChange.bind(this);
		this.state= {
			currentSearch: undefined,
			input: '',
			jwSearch: {videos: [], rate_limit: {remaining: true}},
			warning: '',
		};
		this.suggestionNodes= [];
	}

	bindListNode(ref) {
		this.listNode= ref;
	}

	onChange(event) {
		const	input= event.target.value;
		this.setState({input}, debounce(()=> {
			const searchId= new Date().getTime();
			this.setState({
				currentSearch: searchId,
				loading: 1 < input.length,
				warning: '',
			}, ()=> 1<input.length && this.search(input))
		}, 1000));
		/* 1 second debounce to minimize problems with jw rate limit */
	}

	search(text) {
		const	{currentSearch}= this.state,
			queryParams= {
				text,
				action: 'jwp_api_proxy',
				method: '/videos/list',
				order_by: 'date:desc',
				random: Math.random(),
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

	componentDidUpdate(){
		const {jwSearch, warning}= this.state
		const {loading, rate_limit}= jwSearch;
		const {remaining}= rate_limit;
		if (remaining || loading || warning)
			return;
		this.setState({
			warning: 'JW RATE LIMIT REACHED - please wait a minute'
		});
	}

	componentWillUnmount(){
		if (this.aborter)
			this.aborter.abort();
	}

	selectVideo(vid) {
		this.props.onVideoSelect(vid);
		this.setState({
			input: '',
		});
	}

	render() {
		const { instanceId, props }= this;
		const { autoFocus= true }= props;
		const { input, jwSearch, loading, warning }= this.state;
		const { videos }= jwSearch;
		return el('div', {className: 'jw-videoselector'},
				el('input', {
					autoFocus: autoFocus,
					className: idPfx, 
					onChange: this.onChange,
					onInput: event=> event.stopPropagation(),
					placeholder: 'Type video name',
					role: 'combobox',
					style: {width: '100%'},
					type: 'text',
					value: input,
				}),
				warning ?warning
					:loading 
						?el('div', null, el(Spinner), 'searching JwPlayer for ', el('i', null, input))
						:el(Popover, {position: 'bottom', noArrow: 'noArrow', focusOnMount: false},
							el('div', {
								className: `${idPfx}-input-suggestions`,
								id: `${idPfx}-input-suggestions-${instanceId}`,
								ref: this.bindListNode,
								role: 'listbox',
							}, videos.map((vid, i)=> 
								el('button', {
										className: `${idPfx}-input-suggestion`,
										id: `${idPfx}-${instanceId}-${i}`,
										key: vid.key,
										onClick: ()=> this.selectVideo(vid),
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

