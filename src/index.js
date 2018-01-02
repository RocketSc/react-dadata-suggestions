import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './styles/styles.less';

import SuggestionsList from './components/SuggestionsList';
import QueryInput from './components/QueryInput';

import Api from './api/FetchApi';

class DadataSuggestions extends Component {

  static shortTypes = ['аобл', 'респ', 'вл', 'г', 'гск', 'д', 'двлд', 'днп', 'дор', 'дп', 'жт', 'им', 'к', 'кв', 'кв-л', 'км', 'комн', 'кп', 'лпх', 'м',  'мкр', 'наб', 'нп', 'обл', 'оф', 'п', 'пгт', 'пер', 'пл', 'платф', 'рзд', 'рп', 'с', 'сл', 'снт', 'ст', 'стр', 'тер', 'туп', 'ул', 'х', 'ш'];

  constructor(props) {
    super(props);
    const {token, service} = props;
    this.api = new Api(token, service, props.geolocation);
  }

  state = {
    query: this.props.query,
    suggestions: [],
    selected: -1,
    loading: false,
    error: false,
    showSuggestions: false
  };

  buildRequestBody = (query) => {
    const specialOptions = this.props.specialRequestOptions || {};
    const { count } = this.props;
    return ({
      query,
      count,
      ...specialOptions
    });
  };

  fetchData = (query) => {
    this.setState({
      loading: true,
    });

    const requestBody = this.buildRequestBody(query);

    this.api.suggestions(requestBody)
      .then(suggestions => {
        this.setState({
          suggestions,
          loading: false,
          error: false,
          showSuggestions: true,
        });
      })
      .catch(e => this.onError(e));
  };

  searchWords = () => {
    const { query } = this.state;
    const searchWords = query.split(/\s+/);
    const { service } = this.props;
    if (service === Api.ADDRESS) {
      return searchWords.filter(word => !DadataSuggestions.shortTypes.includes(word));
    }
    return searchWords;
  };

  onChange = (e) => {
    const query = e.target.value;
    this.setState({
      query,
      selected: -1
    });

    const {minChars} = this.props;
    if (query.length >= minChars) {
      this.fetchData(query);
    } else {
      this.setState({
        suggestions: [],
      });
    }

    const { onChange } = this.props;
    if (onChange) {
      onChange(query);
    }
  };

  onError = (e) => {
    this.setState({
      error: true,
      loading: false
    });
    const { onError } = this.props;
    if (onError) {
      onError(e);
    }
  };

  handleKeyPress = (e) => {

    if (e.shiftKey || e.ctrlKey || e.altKey) {
      return;
    }

    const arrowDownKey = 40, arrowUpKey = 38, enterKey = 13, escapeKey = 27, tabKey = 9;

    if ([arrowDownKey, arrowUpKey, enterKey, escapeKey, tabKey].includes(e.which)) {
      e.preventDefault();

      const { selected, suggestions } = this.state;
      const maxSuggestionIndex = suggestions.length - 1;

      if (maxSuggestionIndex === -1) {
        return;
      }

      if (e.which === arrowUpKey) {
        this.setState({
          selected: selected > 0 ? selected - 1 : maxSuggestionIndex
        });
      }
      if (e.which === arrowDownKey) {
        this.setState({
          selected: selected < maxSuggestionIndex ? selected + 1 : 0
        });
      }
      if ((e.which === enterKey || e.which === tabKey) && selected !== -1) {
        this.onSelect(selected)();
      }
      if (e.which === escapeKey) {
        this.makeListInvisible();
      }
    }
  };

  onSelect = (index) => () => {
    const selectedSuggestion = this.state.suggestions[index];
    const query = this.selectedSuggestionFormatter(selectedSuggestion);

    this.setState({
      selected: index,
      showSuggestions: false,
      query
    });

    const { onSelect } = this.props;
    onSelect(selectedSuggestion)
  };

  formatter = (suggestion, name) => {
    const { [name]: customFormatter } = this.props;
    if (customFormatter) {
      return customFormatter(suggestion);
    }
    return suggestion.value;
  };

  suggestionsFormatter = (suggestion) => {
    return this.formatter(suggestion, 'suggestionsFormatter')
  };

  selectedSuggestionFormatter = (suggestion) => {
    return this.formatter(suggestion, 'selectedSuggestionFormatter')
  };

  makeListVisible = () => {
    const { showSuggestions } = this.state;
    if (showSuggestions) {
      return
    }
    this.setState({showSuggestions: true});
  };

  makeListInvisible = () => {
    const { showSuggestions } = this.state;
    if (!showSuggestions) {
      return
    }
    this.setState({showSuggestions: false});
  };

  render() {
    const {loading, query, showSuggestions, suggestions, selected} = this.state;
    return (
      <div>
        <QueryInput
          onChange={ this.onChange }
          loading={ loading }
          query={ query }
          onMouseDown={ this.makeListVisible }
          onKeyPress={ this.handleKeyPress }
        />

        <SuggestionsList
          suggestions={ suggestions }
          hint={ this.props.hint }
          visible={ showSuggestions }
          onSelect={this.onSelect}
          selected={selected}
          suggestionsFormatter={this.suggestionsFormatter}
          searchWords={ this.searchWords }
          highlighting = { this.props.highlighting }
        />
      </div>
    );
  }
}

DadataSuggestions.propTypes = {
  token: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  //deferRequestBy: PropTypes.number.isRequired, // doesn't work with fetch Api
  hint: PropTypes.string.isRequired,
  minChars: PropTypes.number.isRequired,
  geolocation: PropTypes.bool.isRequired,
  query: PropTypes.string.isRequired,
  service: PropTypes.string.isRequired,
  highlighting: PropTypes.bool.isRequired,
  specialRequestOptions: PropTypes.object,

  //handlers:
  onSelect: PropTypes.func.isRequired,
  onChange: PropTypes.func,
  onError: PropTypes.func,
  suggestionsFormatter: PropTypes.func,
  selectedSuggestionFormatter: PropTypes.func,
};
DadataSuggestions.defaultProps = {
  token: '',
  count: 10,
  //deferRequestBy: 300,
  minChars: 3,
  geolocation: true,
  hint: 'Выберите вариант ниже или продолжите ввод',
  query: '',
  service: 'address',
  highlighting: true,
};

export default DadataSuggestions;
