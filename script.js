// アプリケーションクラス
class TravelMap {
    constructor() {
        this.map = null;
        this.pins = this.loadPins();
        this.markers = {};
        this.tempMarker = null;
        this.routeLayer = null;
        this.routeMarkers = { start: null, end: null };
        this.routeMode = 'search'; // 'search' or 'click'
        this.routeClickStep = 'start'; // 'start' or 'end'
        this.manualRoutePoints = { start: null, end: null };
        this.navigationSteps = [];
        this.stepMarkers = [];
        this.showLabels = this.loadLabelsSettings(); // ラベル表示設定を読み込み
        this.categories = {
            tourist: { 
                name: '観光地', 
                color: '#FF6B6B', 
                bgColor: '#FFE5E5',
                icon: 'fas fa-camera',
                gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)'
            },
            food: { 
                name: 'グルメ', 
                color: '#4ECDC4', 
                bgColor: '#E5F9F7',
                icon: 'fas fa-utensils',
                gradient: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7E0 100%)'
            },
            shopping: { 
                name: 'ショッピング', 
                color: '#45B7D1', 
                bgColor: '#E5F4FD',
                icon: 'fas fa-shopping-bag',
                gradient: 'linear-gradient(135deg, #45B7D1 0%, #67C3DD 100%)'
            },
            hotel: { 
                name: '宿泊', 
                color: '#96CEB4', 
                bgColor: '#F0F9F4',
                icon: 'fas fa-bed',
                gradient: 'linear-gradient(135deg, #96CEB4 0%, #B2D8C4 100%)'
            },
            culture: {
                name: '文化',
                color: '#8B5CF6',
                bgColor: '#F3F0FF',
                icon: 'fas fa-theater-masks',
                gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
            },
            cafe: {
                name: 'カフェ',
                color: '#F59E0B',
                bgColor: '#FEF3C7',
                icon: 'fas fa-coffee',
                gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
            },
            transport: {
                name: '交通',
                color: '#3B82F6',
                bgColor: '#DBEAFE',
                icon: 'fas fa-subway',
                gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
            },
            kpop: {
                name: 'エンターテイメント',
                color: '#EC4899',
                bgColor: '#FCE7F3',
                icon: 'fas fa-music',
                gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)'
            }
        };
        
        this.init();
    }
    
    // 初期化
    init() {
        this.initMap();
        this.initEventListeners();
        this.renderPinsList();
        this.showAllPins();
        this.setRouteMode('search'); // デフォルトは入力検索モード
        this.initLabelsToggle(); // ラベル切り替えの初期化
    }
    
    // マップ初期化
    initMap() {
        // 世界地図の中心座標
        const worldCenter = [35.0, 0.0];
        
        this.map = L.map('map', {
            center: worldCenter,
            zoom: 2, // 世界全体が見えるズームレベル
            zoomControl: false // デフォルトのズームコントロールを無効化
        });
        
        // 特殊なズームコントロールを追加（左上に配置）
        L.control.zoom({
            position: 'topleft'
        }).addTo(this.map);
        
        // 現在地ボタンを追加
        L.control.locate({
            position: 'topleft',
            strings: {
                title: '現在地を表示'
            },
            flyTo: true
        }).addTo(this.map);
        
        // ベースマップレイヤーを設定
        const baseMaps = {
            '標準': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }),
            '衛星': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            }),
            '地形': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
                maxZoom: 17
            }),
            'ダーク': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 19
            })
        };
        
        // デフォルトで標準マップを表示
        baseMaps['標準'].addTo(this.map);
        
        // レイヤーコントロールを追加
        L.control.layers(baseMaps, {}, {
            position: 'topright'
        }).addTo(this.map);
        
        // スケールコントロールを追加
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
        }).addTo(this.map);
        
        // マップクリックイベント
        this.map.on('click', (e) => {
            this.handleMapClick(e);
        });
        
        // ズームイベント（ラベルサイズ調整用）
        this.map.on('zoomend', () => {
            this.refreshAllMarkers();
        });
        
        // マップの読み込み状態を表示
        this.map.on('loading', () => {
            document.body.classList.add('map-loading');
        });
        
        this.map.on('load', () => {
            document.body.classList.remove('map-loading');
        });
    }
    
    // イベントリスナー初期化
    initEventListeners() {
        // ピン保存ボタン
        document.getElementById('save-pin-btn').addEventListener('click', () => {
            this.savePinFromForm();
        });
        
        // ピン更新ボタン
        document.getElementById('update-pin-btn').addEventListener('click', () => {
            this.updatePinFromForm();
        });
        
        // 検索機能
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchLocation();
        });
        
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation();
            }
        });
        
        // カテゴリフィルター
        const filterCheckboxes = document.querySelectorAll('[id^="filter-"]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.filterPins();
            });
        });
        
        // ラベル表示切り替え
        document.getElementById('toggle-labels').addEventListener('change', (e) => {
            this.showLabels = e.target.checked;
            this.refreshAllMarkers();
            this.saveLabelsSettings();
        });
        
        // データエクスポート
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        // データインポート
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e);
        });
        
        // ルート検索機能
        document.getElementById('search-route-btn').addEventListener('click', () => {
            this.searchRoute();
        });
        
        document.getElementById('clear-route-btn').addEventListener('click', () => {
            this.clearRoute();
        });
        
        // ピンからの選択
        document.getElementById('route-start-pins').addEventListener('change', (e) => {
            this.selectPinForRoute('start', e.target.value);
        });
        
        document.getElementById('route-end-pins').addEventListener('change', (e) => {
            this.selectPinForRoute('end', e.target.value);
        });
        
        // ルートモード切り替え
        document.getElementById('mode-search').addEventListener('click', () => {
            this.setRouteMode('search');
        });
        
        document.getElementById('mode-click').addEventListener('click', () => {
            this.setRouteMode('click');
        });
        
        // ナビゲーション折りたたみ
        document.getElementById('toggle-navigation').addEventListener('click', () => {
            this.toggleNavigation();
        });
        
        // モーダルイベント
        const addModal = document.getElementById('addPinModal');
        addModal.addEventListener('hidden.bs.modal', () => {
            this.clearTempMarker();
            this.clearForm();
        });
        
        const editModal = document.getElementById('editPinModal');
        editModal.addEventListener('hidden.bs.modal', () => {
            this.clearEditForm();
            this.editingPinId = null;
        });
    }
    
    // マップクリック処理
    handleMapClick(e) {
        const { lat, lng } = e.latlng;
        
        // ルートモードの場合
        if (this.routeMode === 'click') {
            this.handleRouteClick(lat, lng);
            return;
        }
        
        // 通常のピン追加モード
        // 既存の一時マーカーを削除
        this.clearTempMarker();
        
        // 一時マーカーを表示
        this.tempMarker = L.marker([lat, lng], {
            icon: this.createCustomIcon('tourist', true)
        }).addTo(this.map);
        
        // モーダルを表示
        const modal = new bootstrap.Modal(document.getElementById('addPinModal'));
        modal.show();
        
        // 座標を保存
        this.tempCoords = { lat, lng };
    }
    
    // Googleマップ風アイコン作成
    createCustomIcon(category, isTemp = false, labelText = '') {
        const categoryInfo = this.categories[category];
        const opacity = isTemp ? 0.8 : 1;
        const pulseClass = isTemp ? 'google-pulse' : '';
        const size = isTemp ? 50 : 40;
        const shadowSize = isTemp ? 25 : 20;
        
        // ズームレベルに応じたラベルサイズ調整（より大きく、常に表示）
        const zoom = this.map ? this.map.getZoom() : 10;
        // ズームが小さくても大きくても読みやすいサイズに調整
        const labelScale = Math.max(1.0, Math.min(2.0, zoom / 8));
        const labelFontSize = Math.round(12 * labelScale);
        
        // ラベルを常に表示（一時マーカー以外）
        const hasLabel = labelText && !isTemp;
        // ラベルの高さを動的に調整
        const labelHeight = hasLabel ? Math.max(28, 20 * labelScale) : 0;
        const totalHeight = hasLabel ? size * 1.2 + labelHeight : size * 1.2;
        
        return L.divIcon({
            className: `google-marker ${pulseClass}`,
            html: `
                <div class="marker-container">
                    <div class="google-pin" style="
                        background: ${categoryInfo.gradient};
                        opacity: ${opacity};
                        width: ${size}px;
                        height: ${size}px;
                    ">
                        <div class="pin-inner">
                            <i class="${categoryInfo.icon} pin-icon"></i>
                        </div>
                        <div class="pin-shadow" style="width: ${shadowSize}px;"></div>
                    </div>
                    ${hasLabel ? `<div class="pin-label always-visible" style="background-color: ${categoryInfo.color}; font-size: ${labelFontSize}px; font-weight: bold; min-width: ${labelText.length * Math.max(6, labelScale * 4)}px;">${labelText}</div>` : ''}
                </div>
            `,
            iconSize: [Math.max(size, labelText.length * Math.max(6, labelScale * 4)), totalHeight],
            iconAnchor: [Math.max(size, labelText.length * Math.max(6, labelScale * 4))/2, totalHeight],
            popupAnchor: [0, -totalHeight]
        });
    }
    
    // フォームからピンを保存
    savePinFromForm() {
        const name = document.getElementById('pin-name').value.trim();
        const category = document.getElementById('pin-category').value;
        const memo = document.getElementById('pin-memo').value.trim();
        
        if (!name) {
            alert('場所名を入力してください。');
            return;
        }
        
        const pin = {
            id: this.generateId(),
            name: name,
            lat: this.tempCoords.lat,
            lng: this.tempCoords.lng,
            category: category,
            memo: memo,
            visited: false,
            createdAt: new Date().toISOString()
        };
        
        this.addPin(pin);
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('addPinModal'));
        modal.hide();
        
        this.showSuccessMessage('場所を追加しました！');
    }
    
    // ピンを追加
    addPin(pin) {
        this.pins.push(pin);
        this.savePins();
        this.renderPinsList();
        this.showPin(pin);
        this.clearTempMarker();
    }
    
    // ピンをマップに表示
    showPin(pin) {
        const marker = L.marker([pin.lat, pin.lng], {
            icon: this.createCustomIcon(pin.category, false, pin.name)
        }).addTo(this.map);
        
        // ポップアップ作成
        const popupContent = this.createPopupContent(pin);
        marker.bindPopup(popupContent);
        
        this.markers[pin.id] = marker;
    }
    
    // 全てのピンを表示
    showAllPins() {
        this.pins.forEach(pin => {
            this.showPin(pin);
        });
        this.filterPins();
    }
    
    // ポップアップコンテンツ作成
    createPopupContent(pin) {
        const categoryInfo = this.categories[pin.category];
        const visitedIcon = pin.visited ? '✓' : '○';
        const visitedClass = pin.visited ? 'visited' : '';
        
        return `
            <div class="modern-popup ${visitedClass}">
                <div class="popup-header">
                    <i class="${categoryInfo.icon}" style="color: ${categoryInfo.color};"></i>
                    <div class="popup-title">${pin.name}</div>
                </div>
                <div class="popup-category">
                    <span class="category-badge" style="background-color: ${categoryInfo.color};">
                        ${categoryInfo.name}
                    </span>
                </div>
                ${pin.memo ? `<div class="popup-memo"><i class="fas fa-sticky-note"></i> ${pin.memo}</div>` : ''}
                <div class="popup-footer">
                    <div class="popup-actions">
                        <button class="btn btn-sm popup-btn ${pin.visited ? 'btn-warning' : 'btn-success'}" onclick="app.toggleVisited('${pin.id}')">
                            ${visitedIcon} ${pin.visited ? '未訪問' : '訪問済み'}
                        </button>
                        <button class="btn btn-sm btn-outline-primary popup-btn" onclick="app.editPin('${pin.id}')">
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn btn-sm btn-outline-danger popup-btn" onclick="app.deletePin('${pin.id}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                    <div class="popup-date">
                        追加日: ${new Date(pin.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                </div>
            </div>
        `;
    }
    
    // ピン一覧を表示
    renderPinsList() {
        const pinsList = document.getElementById('pins-list');
        
        if (this.pins.length === 0) {
            pinsList.innerHTML = '<p class="text-muted">まだ場所が追加されていません</p>';
            this.updateRouteSelects();
            return;
        }
        
        const sortedPins = [...this.pins].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        const html = sortedPins.map(pin => {
            const categoryInfo = this.categories[pin.category];
            return `
                <div class="pin-item ${pin.visited ? 'visited' : ''}" 
                     onclick="app.focusPin('${pin.id}')" 
                     style="--category-color: ${categoryInfo.color};">
                    <div class="pin-name">
                        <span class="category-dot ${pin.category}"></span>
                        <strong>${pin.name}</strong>
                    </div>
                    <div class="pin-category" style="color: ${categoryInfo.color}; font-weight: 600;">
                        <i class="${categoryInfo.icon}"></i> ${categoryInfo.name}
                    </div>
                    ${pin.memo ? `<div class="pin-memo"><i class="fas fa-sticky-note"></i> ${pin.memo}</div>` : ''}
                    <div class="pin-actions">
                        <button class="btn ${pin.visited ? 'btn-warning' : 'btn-success'} btn-sm google-btn" 
                                onclick="event.stopPropagation(); app.toggleVisited('${pin.id}')">
                            <i class="fas ${pin.visited ? 'fa-undo' : 'fa-check'}"></i>
                            ${pin.visited ? '未訪問' : '完了'}
                        </button>
                        <button class="btn btn-primary btn-sm google-btn" 
                                onclick="event.stopPropagation(); app.editPin('${pin.id}')">
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn btn-danger btn-sm google-btn" 
                                onclick="event.stopPropagation(); app.deletePin('${pin.id}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        pinsList.innerHTML = html;
        
        // ルート選択リストを更新
        this.updateRouteSelects();
    }
    
    // ピンにフォーカス
    focusPin(pinId) {
        const pin = this.pins.find(p => p.id === pinId);
        if (pin && this.markers[pinId]) {
            this.map.setView([pin.lat, pin.lng], 15);
            this.markers[pinId].openPopup();
        }
    }
    
    // 訪問状態切り替え
    toggleVisited(pinId) {
        const pin = this.pins.find(p => p.id === pinId);
        if (pin) {
            pin.visited = !pin.visited;
            this.savePins();
            this.renderPinsList();
            
            // マーカーのポップアップを更新
            if (this.markers[pinId]) {
                const popupContent = this.createPopupContent(pin);
                this.markers[pinId].setPopupContent(popupContent);
            }
        }
    }
    
    // ピン削除
    deletePin(pinId) {
        if (confirm('この場所を削除しますか？')) {
            // 配列から削除
            this.pins = this.pins.filter(p => p.id !== pinId);
            
            // マーカーを削除
            if (this.markers[pinId]) {
                this.map.removeLayer(this.markers[pinId]);
                delete this.markers[pinId];
            }
            
            this.savePins();
            this.renderPinsList();
            this.showSuccessMessage('場所を削除しました。');
        }
    }
    
    // ピン編集
    editPin(pinId) {
        const pin = this.pins.find(p => p.id === pinId);
        if (!pin) {
            this.showErrorMessage('場所が見つかりません。');
            return;
        }
        
        // 編集中のピンIDを保存
        this.editingPinId = pinId;
        
        // フォームに現在の値を設定
        document.getElementById('edit-pin-name').value = pin.name;
        document.getElementById('edit-pin-category').value = pin.category;
        document.getElementById('edit-pin-memo').value = pin.memo || '';
        
        // モーダルを表示
        const modal = new bootstrap.Modal(document.getElementById('editPinModal'));
        modal.show();
    }
    
    // フォームからピンを更新
    updatePinFromForm() {
        if (!this.editingPinId) {
            this.showErrorMessage('編集中のピンが見つかりません。');
            return;
        }
        
        const name = document.getElementById('edit-pin-name').value.trim();
        const category = document.getElementById('edit-pin-category').value;
        const memo = document.getElementById('edit-pin-memo').value.trim();
        
        if (!name) {
            alert('場所名を入力してください。');
            return;
        }
        
        // ピンを更新
        const pinIndex = this.pins.findIndex(p => p.id === this.editingPinId);
        if (pinIndex === -1) {
            this.showErrorMessage('場所が見つかりません。');
            return;
        }
        
        const pin = this.pins[pinIndex];
        const oldCategory = pin.category;
        const oldName = pin.name;
        
        // ピン情報を更新
        pin.name = name;
        pin.category = category;
        pin.memo = memo;
        pin.updatedAt = new Date().toISOString();
        
        // マーカーを更新（カテゴリや名前が変更された場合）
        if (oldCategory !== category || oldName !== name) {
            if (this.markers[this.editingPinId]) {
                this.map.removeLayer(this.markers[this.editingPinId]);
                delete this.markers[this.editingPinId];
            }
            this.showPin(pin);
        } else {
            // ポップアップのみ更新
            if (this.markers[this.editingPinId]) {
                const popupContent = this.createPopupContent(pin);
                this.markers[this.editingPinId].setPopupContent(popupContent);
            }
        }
        
        this.savePins();
        this.renderPinsList();
        this.filterPins();
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('editPinModal'));
        modal.hide();
        
        // 編集IDをクリア
        this.editingPinId = null;
        
        this.showSuccessMessage('場所情報を更新しました！');
    }
    
    // ピンフィルター
    filterPins() {
        const checkedCategories = [];
        document.querySelectorAll('[id^="filter-"]:checked').forEach(checkbox => {
            checkedCategories.push(checkbox.value);
        });
        
        this.pins.forEach(pin => {
            if (this.markers[pin.id]) {
                if (checkedCategories.includes(pin.category)) {
                    this.markers[pin.id].addTo(this.map);
                } else {
                    this.map.removeLayer(this.markers[pin.id]);
                }
            }
        });
    }
    
    // データエクスポート
    exportData() {
        const data = {
            pins: this.pins,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `world-travel-map-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccessMessage('データをエクスポートしました！');
    }
    
    // データインポート
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.pins && Array.isArray(data.pins)) {
                    // 既存のマーカーを削除
                    Object.values(this.markers).forEach(marker => {
                        this.map.removeLayer(marker);
                    });
                    this.markers = {};
                    
                    // 新しいピンを設定
                    this.pins = data.pins;
                    this.savePins();
                    this.renderPinsList();
                    this.showAllPins();
                    
                    this.showSuccessMessage('データをインポートしました！');
                } else {
                    throw new Error('無効なデータ形式です。');
                }
            } catch (error) {
                this.showErrorMessage('データの読み込みに失敗しました: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        // ファイル入力をリセット
        event.target.value = '';
    }
    
    // 検索機能
    async searchLocation() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) {
            this.showErrorMessage('検索ワードを入力してください。');
            return;
        }
        
        const resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = '<div class="text-muted">検索中...</div>';
        
        try {
            // 世界中の場所を検索
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
            const results = await response.json();
            
            if (results.length === 0) {
                resultsDiv.innerHTML = '<div class="text-muted">検索結果が見つかりませんでした。</div>';
                return;
            }
            
            const html = results.map(result => `
                <div class="search-result-item" onclick="app.goToLocation(${result.lat}, ${result.lon}, '${result.display_name.replace(/'/g, "\\'")}')"> 
                    <div class="result-name">${result.display_name}</div>
                    <div class="result-type">${result.type || result.class}</div>
                </div>
            `).join('');
            
            resultsDiv.innerHTML = html;
            
        } catch (error) {
            console.error('検索エラー:', error);
            resultsDiv.innerHTML = '<div class="text-danger">検索に失敗しました。</div>';
        }
    }
    
    // 場所に移動
    goToLocation(lat, lng, name) {
        this.map.setView([lat, lng], 12);
        
        // 一時マーカーを表示
        this.clearTempMarker();
        this.tempMarker = L.marker([lat, lng], {
            icon: this.createCustomIcon('tourist', true)
        }).addTo(this.map);
        
        this.tempMarker.bindPopup(`
            <div class="search-popup">
                <div class="search-popup-title">
                    <i class="fas fa-map-marker-alt" style="color: #007bff;"></i>
                    <strong>${name}</strong>
                </div>
                <button class="btn btn-primary btn-sm mt-2 search-add-btn" onclick="app.addPinFromSearch(${lat}, ${lng}, '${name.replace(/'/g, "\\'")}')">  
                    <i class="fas fa-plus"></i> この場所を追加
                </button>
            </div>
        `).openPopup();
        
        // 검색 결과 클리어
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-input').value = '';
    }
    
    // クイック検索機能
    quickSearch(query) {
        document.getElementById('search-input').value = query;
        this.searchLocation();
    }
    
    // 検索結果からピン追加
    addPinFromSearch(lat, lng, name) {
        this.tempCoords = { lat, lng };
        
        // フォームに名前を設定
        document.getElementById('pin-name').value = name;
        
        // モーダルを表示
        const modal = new bootstrap.Modal(document.getElementById('addPinModal'));
        modal.show();
    }
    
    // LocalStorage関連
    loadPins() {
        try {
            const saved = localStorage.getItem('world-travel-pins');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('ピンの読み込みに失敗:', error);
            return [];
        }
    }
    
    savePins() {
        try {
            localStorage.setItem('world-travel-pins', JSON.stringify(this.pins));
        } catch (error) {
            console.error('ピンの保存に失敗:', error);
            this.showErrorMessage('データの保存に失敗しました。');
        }
    }
    
    // ラベル設定の保存
    saveLabelsSettings() {
        try {
            localStorage.setItem('world-travel-show-labels', JSON.stringify(this.showLabels));
        } catch (error) {
            console.error('ラベル設定の保存に失敗:', error);
        }
    }
    
    // ラベル設定の読み込み
    loadLabelsSettings() {
        try {
            const saved = localStorage.getItem('world-travel-show-labels');
            return saved ? JSON.parse(saved) : true; // デフォルトはtrue
        } catch (error) {
            console.error('ラベル設定の読み込みに失敗:', error);
            return true;
        }
    }
    
    // 全てのマーカーを更新
    refreshAllMarkers() {
        // 既存のマーカーを削除
        Object.values(this.markers).forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = {};
        
        // 新しいアイコンで再表示
        this.pins.forEach(pin => {
            this.showPin(pin);
        });
        
        // フィルターを再適用
        this.filterPins();
    }
    
    // ラベル切り替えの初期化
    initLabelsToggle() {
        const toggleCheckbox = document.getElementById('toggle-labels');
        if (toggleCheckbox) {
            toggleCheckbox.checked = this.showLabels;
        }
    }
    
    // ユーティリティ関数
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    clearTempMarker() {
        if (this.tempMarker) {
            this.map.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }
    }
    
    clearForm() {
        document.getElementById('pin-form').reset();
    }
    
    clearEditForm() {
        document.getElementById('edit-pin-form').reset();
    }
    
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }
    
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }
    
    showMessage(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }
    
    // ルート検索機能
    async searchRoute() {
        const startInput = document.getElementById('route-start').value.trim();
        const endInput = document.getElementById('route-end').value.trim();
        
        if (!startInput || !endInput) {
            this.showErrorMessage('出発地と目的地を入力してください。');
            return;
        }
        
        try {
            // 住所を座標に変換
            const startCoords = await this.geocodeAddress(startInput);
            const endCoords = await this.geocodeAddress(endInput);
            
            if (!startCoords || !endCoords) {
                this.showErrorMessage('住所が見つかりませんでした。');
                return;
            }
            
            await this.calculateRoute(startCoords, endCoords);
            
        } catch (error) {
            console.error('ルート検索エラー:', error);
            this.showErrorMessage('ルート検索に失敗しました。');
        }
    }
    
    // 住所を座標に変換
    async geocodeAddress(address) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
            const results = await response.json();
            
            if (results.length > 0) {
                return {
                    lat: parseFloat(results[0].lat),
                    lng: parseFloat(results[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error('ジオコーディングエラー:', error);
            return null;
        }
    }
    
    // ルート計算
    async calculateRoute(start, end) {
        try {
            // OpenRouteService APIを使用（ナビゲーション指示付き）
            const response = await fetch(
                `https://api.openrouteservice.org/v2/directions/driving-car?` +
                `start=${start.lng},${start.lat}&` +
                `end=${end.lng},${end.lat}&` +
                `format=geojson&` +
                `instructions=true&` +
                `language=ja&` +
                `units=km`,
                {
                    headers: {
                        'Authorization': '5b3ce3597851110001cf6248b18f87c5653b40e1b1ebb60ef57c0c04' // パブリックキー
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('ルートAPIエラー');
            }
            
            const data = await response.json();
            this.displayRoute(data, start, end);
            
        } catch (error) {
            console.error('ルート計算エラー:', error);
            // フォールバック: 直線で表示
            this.displayStraightLine(start, end);
        }
    }
    
    // ルート表示
    displayRoute(routeData, start, end) {
        this.clearRoute();
        
        const route = routeData.features[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // lat,lngに変換
        
        // ルート線を描画
        this.routeLayer = L.polyline(coordinates, {
            color: '#4285f4',
            weight: 5,
            opacity: 0.8,
            dashArray: '0, 10',
            lineCap: 'round'
        }).addTo(this.map);
        
        // アニメーション効果
        let dashOffset = 0;
        const animate = () => {
            dashOffset -= 1;
            this.routeLayer.setStyle({dashOffset: dashOffset});
            requestAnimationFrame(animate);
        };
        animate();
        
        // 出発・到着マーカー
        this.routeMarkers.start = L.marker([start.lat, start.lng], {
            icon: this.createRouteIcon('start')
        }).addTo(this.map);
        
        this.routeMarkers.end = L.marker([end.lat, end.lng], {
            icon: this.createRouteIcon('end')
        }).addTo(this.map);
        
        // ルート情報表示
        const properties = route.properties;
        const segment = properties.segments[0];
        const distance = (segment.distance / 1000).toFixed(1); // km
        const duration = Math.round(segment.duration / 60); // 分
        
        this.showRouteInfo(distance, duration);
        
        // ナビゲーション指示を処理
        if (segment.steps && segment.steps.length > 0) {
            this.processNavigationSteps(segment.steps, coordinates);
            this.showNavigation();
        }
        
        // マップをルートにフィット
        this.map.fitBounds(this.routeLayer.getBounds(), {padding: [20, 20]});
        
        this.showSuccessMessage(`ルートを表示しました！ (${distance}km, ${duration}分)`);
    }
    
    // 直線表示（フォールバック）
    displayStraightLine(start, end) {
        this.clearRoute();
        
        const coordinates = [[start.lat, start.lng], [end.lat, end.lng]];
        
        this.routeLayer = L.polyline(coordinates, {
            color: '#ff6b6b',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(this.map);
        
        this.routeMarkers.start = L.marker([start.lat, start.lng], {
            icon: this.createRouteIcon('start')
        }).addTo(this.map);
        
        this.routeMarkers.end = L.marker([end.lat, end.lng], {
            icon: this.createRouteIcon('end')
        }).addTo(this.map);
        
        // 直線距離計算
        const distance = this.calculateDistance(start.lat, start.lng, end.lat, end.lng);
        
        this.showRouteInfo(distance.toFixed(1), '---');
        this.map.fitBounds(this.routeLayer.getBounds(), {padding: [50, 50]});
        
        this.showErrorMessage('道路ルートが取得できないため、直線で表示します。');
    }
    
    // ルートマーカー作成
    createRouteIcon(type) {
        const config = type === 'start' ? 
            { color: '#34a853', icon: 'fas fa-play', text: 'START' } :
            { color: '#ea4335', icon: 'fas fa-flag-checkered', text: 'GOAL' };
            
        return L.divIcon({
            className: 'route-marker',
            html: `
                <div class="route-pin" style="background: ${config.color};">
                    <i class="${config.icon}"></i>
                </div>
                <div class="route-label">${config.text}</div>
            `,
            iconSize: [60, 80],
            iconAnchor: [30, 70]
        });
    }
    
    // ルート情報表示
    showRouteInfo(distance, duration) {
        const routeInfo = document.getElementById('route-info');
        routeInfo.innerHTML = `
            <div class="route-details">
                <div class="route-stat">
                    <i class="fas fa-route"></i>
                    <span class="stat-value">${distance} km</span>
                    <span class="stat-label">距離</span>
                </div>
                <div class="route-stat">
                    <i class="fas fa-clock"></i>
                    <span class="stat-value">${duration} 分</span>
                    <span class="stat-label">時間</span>
                </div>
            </div>
        `;
        routeInfo.style.display = 'block';
    }
    
    // ルートクリア
    clearRoute() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
        
        Object.values(this.routeMarkers).forEach(marker => {
            if (marker) {
                this.map.removeLayer(marker);
            }
        });
        this.routeMarkers = { start: null, end: null };
        
        document.getElementById('route-info').style.display = 'none';
        document.getElementById('route-start').value = '';
        document.getElementById('route-end').value = '';
        document.getElementById('route-start-pins').value = '';
        document.getElementById('route-end-pins').value = '';
        
        // 手動ルートもクリア
        this.clearManualRoute();
        
        // ナビゲーションもクリア
        this.clearStepMarkers();
        this.navigationSteps = [];
        document.getElementById('route-navigation').style.display = 'none';
    }
    
    // ピンからルート地点選択
    selectPinForRoute(type, pinId) {
        if (!pinId) return;
        
        const pin = this.pins.find(p => p.id === pinId);
        if (pin) {
            const inputId = type === 'start' ? 'route-start' : 'route-end';
            document.getElementById(inputId).value = pin.name;
        }
    }
    
    // 距離計算（ヒュベニの公式）
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 地球の半径 (km)
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRad(degrees) {
        return degrees * (Math.PI/180);
    }
    
    // ルート選択リスト更新
    updateRouteSelects() {
        const startSelect = document.getElementById('route-start-pins');
        const endSelect = document.getElementById('route-end-pins');
        
        // リセット
        startSelect.innerHTML = '<option value="">ピンから選択</option>';
        endSelect.innerHTML = '<option value="">ピンから選択</option>';
        
        // ピンを追加
        this.pins.forEach(pin => {
            const categoryInfo = this.categories[pin.category];
            const option = `<option value="${pin.id}">${categoryInfo.name} - ${pin.name}</option>`;
            startSelect.innerHTML += option;
            endSelect.innerHTML += option;
        });
    }
    
    // ルートモード設定
    setRouteMode(mode) {
        this.routeMode = mode;
        this.routeClickStep = 'start';
        
        // ボタンのアクティブ状態を更新
        document.querySelectorAll('.route-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`mode-${mode}`).classList.add('active');
        
        // UIの表示切り替え
        const inputSection = document.querySelector('.route-inputs');
        const guideSection = document.getElementById('route-manual-guide');
        
        if (mode === 'search') {
            inputSection.style.display = 'block';
            guideSection.style.display = 'none';
            this.clearManualRoute();
        } else {
            inputSection.style.display = 'none';
            guideSection.style.display = 'block';
            this.updateRouteGuide();
        }
        
        // マップカーソルを変更
        this.map.getContainer().style.cursor = mode === 'click' ? 'crosshair' : '';
    }
    
    // ルートクリック処理
    handleRouteClick(lat, lng) {
        if (this.routeClickStep === 'start') {
            // 出発地設定
            this.manualRoutePoints.start = { lat, lng };
            
            // 既存の出発マーカーを削除
            if (this.routeMarkers.start) {
                this.map.removeLayer(this.routeMarkers.start);
            }
            
            // 出発マーカーを追加
            this.routeMarkers.start = L.marker([lat, lng], {
                icon: this.createRouteIcon('start')
            }).addTo(this.map);
            
            this.routeClickStep = 'end';
            this.updateRouteGuide();
            
        } else if (this.routeClickStep === 'end') {
            // 目的地設定
            this.manualRoutePoints.end = { lat, lng };
            
            // 既存の目的マーカーを削除
            if (this.routeMarkers.end) {
                this.map.removeLayer(this.routeMarkers.end);
            }
            
            // 目的マーカーを追加
            this.routeMarkers.end = L.marker([lat, lng], {
                icon: this.createRouteIcon('end')
            }).addTo(this.map);
            
            // ルートを計算
            this.calculateRoute(this.manualRoutePoints.start, this.manualRoutePoints.end);
            
            // モードをリセット
            this.routeClickStep = 'start';
            this.updateRouteGuide();
        }
    }
    
    // ルートガイド更新
    updateRouteGuide() {
        const startGuide = document.getElementById('guide-start');
        const endGuide = document.getElementById('guide-end');
        
        if (this.routeClickStep === 'start') {
            startGuide.classList.add('active');
            endGuide.classList.remove('active');
        } else {
            startGuide.classList.remove('active');
            endGuide.classList.add('active');
        }
    }
    
    // 手動ルートクリア
    clearManualRoute() {
        this.manualRoutePoints = { start: null, end: null };
        this.routeClickStep = 'start';
        this.updateRouteGuide();
    }
    
    // ナビゲーションステップを処理
    processNavigationSteps(steps, coordinates) {
        this.navigationSteps = [];
        this.clearStepMarkers();
        
        steps.forEach((step, index) => {
            // ステップ情報を日本語化
            const instruction = this.translateInstruction(step);
            const distance = step.distance > 1000 ? 
                `${(step.distance / 1000).toFixed(1)}km` : 
                `${Math.round(step.distance)}m`;
            
            // 座標を取得（way_pointsから）
            let stepCoord = null;
            if (step.way_points && step.way_points.length > 0) {
                const waypointIndex = step.way_points[0];
                if (coordinates[waypointIndex]) {
                    stepCoord = coordinates[waypointIndex];
                }
            }
            
            const navigationStep = {
                step: index + 1,
                instruction: instruction,
                distance: distance,
                duration: step.duration ? Math.round(step.duration / 60) : 0,
                coordinate: stepCoord,
                type: step.type,
                modifier: step.modifier
            };
            
            this.navigationSteps.push(navigationStep);
            
            // ステップマーカーを追加
            if (stepCoord && index > 0 && index < steps.length - 1) {
                this.addStepMarker(stepCoord, index + 1, step.type);
            }
        });
    }
    
    // 指示を日本語に翻訳
    translateInstruction(step) {
        const type = step.type;
        const modifier = step.modifier;
        const streetName = step.name || '';
        
        // 基本的な指示の翻訳
        const translations = {
            'depart': '出発',
            'arrive': '到着',
            'turn': '曲がる',
            'continue': '直進',
            'merge': '合流',
            'ramp': 'ランプ',
            'roundabout': 'ロータリー'
        };
        
        const modifierTranslations = {
            'left': '左',
            'right': '右',
            'sharp left': '大きく左',
            'sharp right': '大きく右',
            'slight left': 'やや左',
            'slight right': 'やや右',
            'straight': '直進',
            'uturn': 'Uターン'
        };
        
        let instruction = '';
        
        if (type === 'depart') {
            instruction = streetName ? `${streetName}を出発` : '出発します';
        } else if (type === 'arrive') {
            instruction = '目的地に到着します';
        } else if (type === 'turn' && modifier) {
            const direction = modifierTranslations[modifier] || modifier;
            instruction = streetName ? 
                `${direction}に曲がって${streetName}に入ります` :
                `${direction}に曲がります`;
        } else if (type === 'continue') {
            instruction = streetName ? 
                `${streetName}を直進します` :
                '直進します';
        } else {
            // フォールバック
            const baseInstruction = translations[type] || type;
            const modifierText = modifier ? modifierTranslations[modifier] || modifier : '';
            instruction = `${baseInstruction}${modifierText ? ` (${modifierText})` : ''}${streetName ? ` - ${streetName}` : ''}`;
        }
        
        return instruction;
    }
    
    // ステップマーカーを追加
    addStepMarker(coordinate, stepNumber, type) {
        const icon = this.getStepIcon(type);
        
        const marker = L.marker(coordinate, {
            icon: L.divIcon({
                className: 'step-marker',
                html: `
                    <div class="step-marker-content">
                        <div class="step-number">${stepNumber}</div>
                        <i class="${icon} step-icon"></i>
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);
        
        this.stepMarkers.push(marker);
    }
    
    // ステップタイプに応じたアイコンを取得
    getStepIcon(type) {
        const icons = {
            'turn': 'fas fa-share',
            'continue': 'fas fa-arrow-up',
            'merge': 'fas fa-code-branch',
            'ramp': 'fas fa-road',
            'roundabout': 'fas fa-circle-notch',
            'depart': 'fas fa-play',
            'arrive': 'fas fa-flag-checkered'
        };
        
        return icons[type] || 'fas fa-arrow-right';
    }
    
    // ナビゲーション表示
    showNavigation() {
        const navigationDiv = document.getElementById('route-navigation');
        const stepsDiv = document.getElementById('navigation-steps');
        
        if (this.navigationSteps.length === 0) {
            navigationDiv.style.display = 'none';
            return;
        }
        
        const stepsHtml = this.navigationSteps.map((step, index) => `
            <div class="nav-step" data-step="${index}">
                <div class="step-header">
                    <div class="step-icon-container">
                        <i class="${this.getStepIcon(step.type)} nav-step-icon"></i>
                        <span class="step-counter">${step.step}</span>
                    </div>
                    <div class="step-content">
                        <div class="step-instruction">${step.instruction}</div>
                        <div class="step-details">
                            ${step.distance} ・ ${step.duration > 0 ? `${step.duration}分` : '0分'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        stepsDiv.innerHTML = stepsHtml;
        navigationDiv.style.display = 'block';
    }
    
    // ナビゲーションの折りたたみ切り替え
    toggleNavigation() {
        const content = document.querySelector('.navigation-content');
        const toggleBtn = document.getElementById('toggle-navigation');
        const icon = toggleBtn.querySelector('i');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
        } else {
            content.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        }
    }
    
    // ステップマーカーをクリア
    clearStepMarkers() {
        this.stepMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.stepMarkers = [];
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TravelMap();
});

// モバイル用サイドバートグル（必要に応じて）
if (window.innerWidth <= 768) {
    // モバイル用のサイドバートグルボタンを追加
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sidebar-toggle btn btn-outline-secondary';
    toggleButton.innerHTML = '☰';
    toggleButton.onclick = () => {
        document.querySelector('.sidebar').classList.toggle('show');
    };
    document.body.appendChild(toggleButton);
}