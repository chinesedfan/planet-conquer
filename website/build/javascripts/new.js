(function() {
  var WS, audio, bg_img, onmusic, onmusic_btn, onplay, onplay_btn;

  onmusic = true;

  audio = $('audio#music')[0];

  onmusic_btn = $('#music_play');

  onmusic_btn.click(function() {
    if (onmusic) {
      audio.pause();
      onmusic_btn.text("=");
    } else {
      audio.play();
      onmusic_btn.text(">");
    }
    return onmusic = !onmusic;
  });

  bg_img = $('.bg img');

  bg_img.load(function() {
    return bg_img.addClass('on');
  });

  onplay = true;

  onplay_btn = $('#game_play');

  onplay_btn.click(function() {
    if (onplay) {
      onplay_btn.text("=");
    } else {
      onplay_btn.text(">");
    }
    return onplay = !onplay;
  });

  if (typeof MozWebSocket !== "undefined" && MozWebSocket !== null) {
    WS = MozWebSocket;
  } else {
    WS = WebSocket;
  }

  this.ws = new WS("ws://" + config.addr + "/info");

  ws._send = ws.send;

  ws.send = function(data) {
    if (typeof data === 'string') {
      data = {
        op: data
      };
    }
    data.room = config.room;
    return this._send(JSON.stringify(data));
  };

  ws.onopen = function() {
    ws.send('setroom');
    ws.send('map');
    return ws.send('info');
  };

  ws.onmessage = function(e) {
    var cell, data, def, from, hold, html, i, info, log, logs, p, planet, planet_id, r, res, t, tactic, to, top, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4;
    if (!onplay) {
      return;
    }
    data = $.parseJSON(e.data);
    if (config.debug) {
      console.log(data);
    }
    switch (data.op) {
      case 'map':
        window.map = data;
        map.step = map.step * 1000;
        map.dom = $('#map');
        cell = Math.floor(940 / map.map_size[0]);
        info = "<h2 id='map-name'>" + map.name + "</h2>";
        info += " <div id='map-author'>author: " + map.author + "</div>";
        info += "<div id='map-desc'>" + map.desc + "</div>";
        $('#map-info').html(info);
        _ref = map.planets;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          p = _ref[i];
          p.id = i;
          $("<div id='planet_" + i + "' planet_type='" + (p.type || 'normal') + "' class='cell planet planet-" + p.type + "' style='margin:" + (p.pos[1] * cell) + "px 0 0 " + (p.pos[0] * cell) + "px'></div>").appendTo(map.dom);
          p.dom = $('#planet_' + i);
          p.dom.data('planet', i);
          if (i === 0) {
            map.offest_size = $('#planet_0').width();
          }
          def = [];
          _.times(Math.floor(p.def + 1), function() {
            return def.push('⊙');
          });
          def = def.join(' ');
          res = [];
          _.times(Math.floor(p.res), function() {
            return res.push('★');
          });
          res = res.join(' ');
          p.dom.after("<span class='planet_info' style='margin:" + (p.pos[1] * cell - 16) + "px 0 0 " + (p.pos[0] * cell - map.offest_size / 2) + "px'>⊙" + p.def + " ★" + p.res + " + " + p.cos + "</span><span class='planet_info' style='margin:" + (p.pos[1] * cell + map.offest_size + 4) + "px 0 0 " + (p.pos[0] * cell - map.offest_size / 2) + "px'>≤" + p.max + "</span>").next();
          map.planets[i] = p;
        }
        html = ["<svg style='width:100%;height:" + (cell * map.map_size[1]) + "px;position:absolute'>"];
        _ref1 = map.routes;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          r = _ref1[_j];
          if (r[0] > r[1]) {
            continue;
          }
          from = $('#planet_' + r[0]).offset();
          to = $('#planet_' + r[1]).offset();
          html.push("<line x1='" + (from.left + (map.offest_size / 2)) + "' y1='" + (from.top + (map.offest_size / 2)) + "' x2='" + (to.left + (map.offest_size / 2)) + "' y2='" + (to.top + (map.offest_size / 2)) + "' style='stroke:#444;stroke-width:2px' stroke-dasharray='3,3' />");
        }
        html.push('</svg>');
        return $('body').prepend(html.join(''));
      case 'info':
        window.players = data.players;
        if (!data.players) {
          return;
        }
        if (players[0]) {
          players[0].color = '#EE2C44';
        }
        if (players[1]) {
          players[1].color = '#42C3D9';
        }
        if (players[2]) {
          players[2].color = '#E96FA9';
        }
        if (players[3]) {
          players[3].color = '#A5CF4E';
        }
        _ref2 = data.holds;
        for (planet_id = _k = 0, _len2 = _ref2.length; _k < _len2; planet_id = ++_k) {
          hold = _ref2[planet_id];
          planet = map.planets[planet_id];
          planet.hold = hold[0];
          if (hold[0] !== null) {
            planet.dom.html(hold[1])[0].className = 'cell player_' + hold[0];
          } else {
            planet.dom.html('')[0].className = 'cell planet';
          }
        }
        logs = $('#logs').html('');
        _ref3 = data.logs;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          log = _ref3[_l];
          switch (log.type) {
            case 'move':
              (function(move) {
                var dom, from_xy, to_xy;
                from = map.planets[move.from].dom;
                from_xy = from.offset();
                to = map.planets[move.to].dom;
                to_xy = to.offset();
                dom = $("<div class='move player_" + move.side + "' style='left:" + (from_xy.left + map.offest_size / 3.7) + "px;top:" + (from_xy.top + map.offest_size / 3.7) + "px'>" + move.count + "</div>");
                map.dom.append(dom);
                return dom.animate({
                  left: to_xy.left + map.offest_size / 3.7,
                  top: to_xy.top + map.offest_size / 3.7
                }, map.step * (move.step - 1), function() {
                  return dom.remove();
                });
              })(log);
              logs.trigger('log', "<p style='color:" + players[log.side].color + "'>" + players[log.side].name + ": Send " + log.count + " troops from No." + log.from + " to No." + log.to + ".</p>");
              break;
            case 'production':
              true;
              break;
            case 'occupy':
              $('#planet_' + log.planet).animate({
                opacity: 0
              }, 500, function() {
                return $(this).animate({
                  opacity: 1
                }, 500);
              });
              break;
            case 'battle':
              if (log.winner === log.defence) {
                logs.trigger('log', "<p style='color:" + players[log.winner].color + "'>" + players[log.winner].name + ": Successfully block the " + players[log.attack].name + "'s offensive<p>");
              } else {
                logs.trigger('log', "<p style='color:" + players[log.winner].color + "'>" + players[log.winner].name + ": Occupation of the No." + log.planet + " planet</p>");
              }
              break;
            case 'tactic':
              tactic = log.tactic;
              logs.trigger('log', "<p style='color: red'>tactic: " + tactic.type + "</p>");
          }
        }
        top = [];
        _ref4 = _.sortBy(players, function(p) {
          return -(p.planets * 10000 + p.units);
        });
        for (i = _m = 0, _len4 = _ref4.length; _m < _len4; i = ++_m) {
          t = _ref4[i];
          top.push("<div class='top_" + i + "' style='color:" + t.color + "'><span>" + (i + 1) + "</span><p><strong>" + t.name + "</strong><br />Planets: " + t.planets + "<br />Units: " + t.units + "<br />status: " + t.status + "<br/>Points: " + t.points + "</p></div>");
        }
        $('#top').html(top.join(''));
        $('#round').html("Round " + data.round + "/" + map.max_round);
        return $('#status').html(data.status);
    }
  };

  ws.onerror = function(e) {
    if (config.debug) {
      return console.log(e);
    }
  };

  $('#logs').bind('log', function(e, msg) {
    return this.innerHTML = msg + this.innerHTML;
  });

  $('#show_logs').click(function() {
    return $("#logs").toggle(200);
  });

}).call(this);
