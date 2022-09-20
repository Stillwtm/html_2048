var map_size = 4;
// map_size * map_size的二维数组，表示地图
var map = new Array(map_size).fill(0).map(() => new Array(map_size).fill(0));
// 记录是否可以被合并，已经合并过则不能再次合并
var merge_avai = new Array(map_size).fill(1).map(() => new Array(map_size).fill(1));
// 记录tile的移动
var move_cache = new Array();
// 整局游戏的分数
var score = 0;
// 单次移动的分数
var one_score = 0;
// 分数字体大小列表
var score_sizes = ["2em", "2em", "1.8em", "1.6em", "1.4em", "1.4em", "1.3em"];

function init () {
    window.tile_length = parseInt(window.getComputedStyle(
        document.documentElement).getPropertyValue("--cell-length"));
    window.grid_gap = parseInt(window.getComputedStyle(
        document.documentElement).getPropertyValue("--gap"));
    // 变量初始化
    score = 0;
    map = map.map(() => new Array(map_size).fill(0));
    deleteAllChildren();
    drawAddingScore();
    document.getElementById("gameover-mask").style.visibility = "hidden";
    // 生成两个初始tile
    var new_tile_rcv = generateTile()
    drawSpawningTile(new_tile_rcv);
    map[new_tile_rcv.r][new_tile_rcv.c] = new_tile_rcv.val;
    new_tile_rcv = generateTile()
    drawSpawningTile(new_tile_rcv);
    map[new_tile_rcv.r][new_tile_rcv.c] = new_tile_rcv.val;
}

// 生成[min, floor(max))的随机整数
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// 判断map是否还有空余位置
function isMapAvailable() {
    return map.some((e) => e.some((e) => e == 0));
}

function isMapMoveable() {
    for (let i = 0; i < map_size - 1; i++) {
        for (let j = 0; j < map_size; j++) {
            if (map[i][j] == map[i + 1][j]) return true;
        }
    }
    for (let i = 0; i < map_size; i++) {
        for (let j = 0; j < map_size - 1; j++) {
            if (map[i][j] == map[i][j + 1]) return true;
        }
    }
    return false;
}

// 在一个可行位置生成新的2或4
function generateTile() {
    if (!isMapAvailable()) {
        return null;
    }

    var new_r, new_c;
    do {
        new_r = getRandomInt(0, map_size);
        new_c = getRandomInt(0, map_size);
    } while (map[new_r][new_c]);

    let p = 0.9;  // 生成2的概率
    return { r: new_r, c: new_c, val: Math.random() < p ? 2 : 4 };
}

// 4 2 2会直接合并成一个数字，数字还不对
// 向左移动tile，主要是循环顺序区别
function moveLeft() {
    for (let i = 0; i < map_size; i++) {
        var blank = -1;
        for (let j = 0; j < map_size; j++) {
            if (map[i][j]) {
                // 是否可以合并
                if (blank > 0 && map[i][blank - 1] == map[i][j] && merge_avai[i][blank - 1]
                    || j > 0 && map[i][j - 1] == map[i][j]) {
                    if (blank == -1) blank = j;
                    // 数字变为两倍
                    map[i][blank - 1] = map[i][j] << 1;
                    map[i][j] = 0;
                    merge_avai[i][blank - 1] = false;
                    one_score += map[i][blank - 1];
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: i,
                        to_c: blank - 1,
                        from_val: map[i][blank - 1] >> 1,
                        to_val: map[i][blank - 1],
                    });
                } else if (blank != -1) {
                    // 移动数字
                    map[i][blank] = map[i][j];
                    map[i][j] = 0;
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: i,
                        to_c: blank,
                        from_val: map[i][blank],
                        to_val: map[i][blank],
                    });
                    blank++;
                }
            } else {
                if (blank == -1) blank = j;
            }
        }
    }
}

// 向右移动tile，主要是循环顺序区别
function moveRight() {
    for (let i = 0; i < map_size; i++) {
        var blank = map_size;
        for (let j = map_size - 1; j >= 0; j--) {
            if (map[i][j]) {
                // 是否可以合并
                if (blank < map_size - 1 && map[i][blank + 1] == map[i][j] && merge_avai[i][blank + 1]
                    || j < map_size - 1 && map[i][j + 1] == map[i][j]) {
                    if (blank == map_size) blank = j;
                    // 数字变为两倍
                    map[i][blank + 1] = map[i][j] << 1;
                    map[i][j] = 0;
                    merge_avai[i][blank + 1] = false;
                    one_score += map[i][blank + 1];
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: i,
                        to_c: blank + 1,
                        from_val: map[i][blank + 1] >> 1,
                        to_val: map[i][blank + 1],
                    });
                } else if (blank != map_size) {
                    // 移动数字
                    map[i][blank] = map[i][j];
                    map[i][j] = 0;
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: i,
                        to_c: blank,
                        from_val: map[i][blank],
                        to_val: map[i][blank],
                    });
                    blank--;
                }
            } else {
                if (blank == map_size) blank = j;
            }
        }
    }
}

// 向上移动tile，主要是循环顺序区别
function moveUp() {
    for (let j = 0; j < map_size; j++) {
        var blank = -1;
        for (let i = 0; i < map_size; i++) {
            if (map[i][j]) {
                // 是否可以合并
                if (blank > 0 && map[blank - 1][j] == map[i][j] && merge_avai[blank - 1][j]
                    || i > 0 && map[i - 1][j] == map[i][j]) {
                    if (blank == -1) blank = i;
                    // 数字变为两倍
                    map[blank - 1][j] = map[i][j] << 1;
                    map[i][j] = 0;
                    merge_avai[blank - 1][j] = false;
                    one_score += map[blank - 1][j];
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: blank - 1,
                        to_c: j,
                        from_val: map[blank - 1][j] >> 1,
                        to_val: map[blank - 1][j],
                    });
                } else if (blank != -1) {
                    // 移动数字
                    map[blank][j] = map[i][j];
                    map[i][j] = 0;
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: blank,
                        to_c: j,
                        from_val: map[blank][j],
                        to_val: map[blank][j],
                    });
                    blank++;
                }
            } else {
                if (blank == -1) blank = i;
            }
        }
    }
}

// 向下移动tile，主要是循环顺序区别
function moveDown() {
    for (let j = 0; j < map_size; j++) {
        var blank = map_size;
        for (let i = map_size - 1; i >= 0; i--) {
            if (map[i][j]) {
                // 是否可以合并
                if (blank < map_size - 1 && map[blank + 1][j] == map[i][j] && merge_avai[blank + 1][j]
                    || i < map_size - 1 && map[i + 1][j] == map[i][j]) {
                    if (blank == map_size) blank = i;
                    // 数字变为两倍
                    map[blank + 1][j] = map[i][j] << 1;
                    map[i][j] = 0;
                    merge_avai[blank + 1][j] = false;
                    one_score += map[blank + 1][j];
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: blank + 1,
                        to_c: j,
                        from_val: map[blank + 1][j] >> 1,
                        to_val: map[blank + 1][j],
                    });
                } else if (blank != map_size) {
                    // 移动数字
                    map[blank][j] = map[i][j];
                    map[i][j] = 0;
                    move_cache.push({
                        from_r: i,
                        from_c: j,
                        to_r: blank,
                        to_c: j,
                        from_val: map[blank][j],
                        to_val: map[blank][j],
                    });
                    blank--;
                }
            } else {
                if (blank == map_size) blank = i;
            }
        }
    }
}

// 将移动过的tile在map中置零
function setMovedTileZero() {
    move_cache.forEach(move => {
        map[move.to_r][move.to_c] = 0;
    });
}

// 清空DOM中所有孩子
function deleteAllChildren() {
    var game_board = document.getElementById("tile-container");
    while (game_board.hasChildNodes()) {
        game_board.removeChild(game_board.lastChild);
    }
}

// 绘制未移动tile
function drawStaticTiles() {
    var game_board = document.getElementById("tile-container");

    for (let i = 0; i < map_size; i++) {
        for (let j = 0; j < map_size; j++) {
            if (map[i][j]) {
                var tile = document.createElement("div");
                tile.textContent = map[i][j];
                tile.setAttribute("class", `tile-base tile${map[i][j]}`);
                tile.style.setProperty("grid-row", i + 1);
                tile.style.setProperty("grid-column", j + 1);
                game_board.appendChild(tile);
            }
        }
    }
}

// 绘制移动过的tile
function drawMovingTiles() {
    var game_board = document.getElementById("tile-container");

    for (let move of move_cache) {
        // 由于setTimeout中使用到的变量须使用let
        let move_r = move.to_r - move.from_r;
        let move_c = move.to_c - move.from_c;
        let tile = document.createElement("div");
        tile.textContent = move.from_val
        tile.setAttribute("class", `tile-base tile${move.from_val}`);
        tile.style.setProperty("grid-row", move.to_r + 1);
        tile.style.setProperty("grid-column", move.to_c + 1);
        game_board.appendChild(tile);
        
        let move_x = -move_c * (tile_length + grid_gap);
        let move_y = -move_r * (tile_length + grid_gap);
        tile.animate([
            { translate: `${move_x}px ${move_y}px` },
            { translate: "0px 0px" },
        ], {
            duration: 150,
        });
        setTimeout(function () {
            tile.textContent = move.to_val;
            if (move.from_val == move.to_val) {
                tile.setAttribute("class", `tile-base tile${move.to_val}`);
            } else {
                tile.setAttribute("class", `tile-base tile-merging tile${move.to_val}`);
            }
        }, 100);
    }
}

// 绘制新生成的tile
function drawSpawningTile(tile_rcv) {
    var game_board = document.getElementById("tile-container");

    var tile = document.createElement("div");
    tile.textContent = tile_rcv.val;
    tile.setAttribute("class", `tile-base tile-spawning tile${tile_rcv.val}`);
    tile.style.setProperty("grid-row", tile_rcv.r + 1);
    tile.style.setProperty("grid-column", tile_rcv.c + 1);
    game_board.appendChild(tile);
}

// 绘制加分动画
function drawAddingScore() {
    var score_element = document.getElementById("score-number");
    score_element.textContent = score;
    for (var level = 1; Math.pow(10, level) <= score; level++);
    score_element.style.setProperty("font-size", score_sizes[level - 1]);
    
    if (one_score) {
        var adding_score = document.getElementById("adding-score");
        adding_score.textContent = `+${one_score}`;
        adding_score.setAttribute("class", "fade-out");
    }
}

// 最开始的加载
window.onload = function () {
    init();
    document.getElementById("adding-score").addEventListener('animationend', function() {
        this.classList.remove("fade-out");
    });
}

// 监听键盘，同时是整个游戏更新的触发逻辑
document.addEventListener('keydown', function (ev) {
    // 处理移动逻辑
    move_cache = [];
    one_score = 0;
    merge_avai = merge_avai.map(() => new Array(map_size).fill(true));
    switch (ev.key) {
        case "ArrowUp": moveUp(); break;
        case "ArrowDown": moveDown(); break;
        case "ArrowLeft": moveLeft(); break;
        case "ArrowRight": moveRight(); break;
        default: return;
    }
    score += one_score;
    // 若没有移动，则不新生成tile
    if (move_cache.length == 0) return;
    // 生成新tile
    var new_tile_rcv = generateTile();
    console.log(new_tile_rcv);
    // 将移动过的tile在map中置零，为后面draw做准备
    setMovedTileZero();

    // 画面重绘
    // 绘制未移动tile -> 播放移动动画 -> 加分动画 -> 新tile出现动画
    deleteAllChildren();
    drawStaticTiles();
    drawMovingTiles();
    setTimeout(drawAddingScore(), 100);
    if (new_tile_rcv) {
        setTimeout(() => drawSpawningTile(new_tile_rcv), 100);
    }

    // 更新map
    move_cache.forEach(move => {
        map[move.to_r][move.to_c] = move.to_val;
    });
    map[new_tile_rcv.r][new_tile_rcv.c] = new_tile_rcv.val;

    // 游戏是否结束
    if (!isMapAvailable() && !isMapMoveable()) {
        setTimeout(function () {
            document.getElementById("gameover-mask").style.visibility = "visible";
        }, 1000);
    }
});
