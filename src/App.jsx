import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WoodBlockWave3D = () => {
  const mountRef = useRef(null);
  const [gridSize, setGridSize] = useState(30);
  const [patternNumber, setPatternNumber] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [basePattern, setBasePattern] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // パターン番号から規則的なパラメータを生成（10×10基本パターン）
  const getPatternParams = (num) => {
    const patterns = [
      { type: 'sine', freq: 2, amp: 3, dir: 0, phase: 0, rotate: false, name: '水平波（基本）' },
      { type: 'sine', freq: 3, amp: 3, dir: 0, phase: 0, rotate: true, name: '斜め縞（密）///' },
      { type: 'sine', freq: 2, amp: 3, dir: 90, phase: 0, rotate: true, name: '斜め縞（標準）///' },
      { type: 'sine', freq: 2, amp: 3, dir: 45, phase: 0, rotate: false, name: '斜め波45°' },
      { type: 'double', freq: 2, amp: 3, dir: 0, phase: 0, rotate: false, name: '格子パターン' },
      { type: 'circular', freq: 2, amp: 3, dir: 0, phase: 0, rotate: false, name: '同心円' },
      { type: 'sine', freq: 1, amp: 3, dir: 0, phase: 0, rotate: true, name: 'ゆったり斜め縞///' },
      { type: 'double', freq: 3, amp: 3, dir: 0, phase: 0, rotate: false, name: '細かい格子' },
      { type: 'sine', freq: 2, amp: 3, dir: 0, phase: 90, rotate: true, name: '位相シフト斜め縞///' },
      { type: 'checkerboard', freq: 2, amp: 3, dir: 0, phase: 0, rotate: false, name: '市松模様' },
    ];

    const index = ((num - 1) % patterns.length + patterns.length) % patterns.length;
    return patterns[index];
  };

  const currentParams = getPatternParams(patternNumber);

  // 10×10の基本パターンを生成
  const generateBasePattern = (params) => {
    const baseSize = 10;
    const pattern = [];
    const { type: waveType, freq: frequency, amp: amplitude, dir: direction, phase, rotate } = params;

    for (let i = 0; i < baseSize; i++) {
      const row = [];
      for (let j = 0; j < baseSize; j++) {
        let height;
        let x = i - baseSize / 2;
        let z = j - baseSize / 2;

        // rotate=trueの場合、座標系を45度回転（縞模様を///にする）
        if (rotate) {
          const tempX = x;
          x = (tempX + z) / Math.sqrt(2);
          z = (-tempX + z) / Math.sqrt(2);
        }

        if (waveType === 'sine') {
          const angle = direction * Math.PI / 180;
          const rotatedX = x * Math.cos(angle) + z * Math.sin(angle);
          height = amplitude * Math.sin(rotatedX * Math.PI * frequency / baseSize + phase * Math.PI / 180);
        } else if (waveType === 'double') {
          height = amplitude * (
            Math.sin(x * Math.PI * frequency / baseSize) * 0.5 +
            Math.sin(z * Math.PI * frequency / baseSize) * 0.5
          );
        } else if (waveType === 'circular') {
          const dist = Math.sqrt(x * x + z * z);
          height = amplitude * Math.sin(dist * Math.PI * frequency / baseSize);
        } else if (waveType === 'checkerboard') {
          height = ((i + j) % 2 === 0) ? amplitude : -amplitude;
        }

        // 高さを4段階に離散化（0, 2, 4, 6mm）
        const discreteHeight = Math.round((height + amplitude) / 2) * 2;
        row.push(Math.max(0, Math.min(6, discreteHeight)));
      }
      pattern.push(row);
    }
    return pattern;
  };

  // パターンをタイル状に繰り返して拡張（反転処理を追加）
  const getHeightAt = (i, j, pattern, patternNum) => {
    const baseSize = pattern.length;

    // パターン2,3,7,9（斜め縞）は反転しない
    const noFlipPatterns = [2, 3, 7, 9];
    const shouldFlip = !noFlipPatterns.includes(patternNum);

    // どのタイルに属するか計算
    const tileX = Math.floor(i / baseSize);
    const tileY = Math.floor(j / baseSize);

    // タイル内の座標
    let localI = i % baseSize;
    let localJ = j % baseSize;

    if (shouldFlip) {
      // 奇数列のタイルは水平反転
      if (tileX % 2 === 1) {
        localI = baseSize - 1 - localI;
      }

      // 奇数行のタイルは垂直反転
      if (tileY % 2 === 1) {
        localJ = baseSize - 1 - localJ;
      }
    }

    return pattern[localI][localJ];
  };

  useEffect(() => {
    const newBasePattern = generateBasePattern(currentParams);
    setBasePattern(newBasePattern);
  }, [patternNumber]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );

    const baseDist = 30 / zoomLevel;
    camera.position.set(baseDist, baseDist * 1.2, baseDist);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // マウスホイールでズーム
    const handleWheel = (e) => {
      e.preventDefault();
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
    };
    renderer.domElement.addEventListener('wheel', handleWheel);

    // ライト
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // ベースボード
    const boardGeometry = new THREE.BoxGeometry(gridSize * 1.5, 0.5, gridSize * 1.5);
    const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = -0.5;
    board.receiveShadow = true;
    scene.add(board);

    // ブロック生成
    const blockSize = 1.5;
    const blockGeometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const blocks = [];
    const pattern = basePattern.length > 0 ? basePattern : generateBasePattern(currentParams);

    // 4段階の高さに応じた色
    const heightColors = [
      new THREE.Color(0x8B4513), // 0mm - 濃い茶色 (階層0)
      new THREE.Color(0xA0522D), // 2mm (階層1)
      new THREE.Color(0xCD853F), // 4mm (階層2)
      new THREE.Color(0xDAA520), // 6mm (階層3)
    ];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const discreteHeight = getHeightAt(i, j, pattern, patternNumber);
        const heightIndex = discreteHeight / 2; // 0,2,4,6 -> 0,1,2,3

        const color = heightColors[Math.min(heightIndex, 3)];
        const blockMaterial = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.8,
          metalness: 0.2
        });

        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.set(
          i * blockSize - gridSize * blockSize / 2 + blockSize / 2,
          discreteHeight / 10 + 0.7,
          j * blockSize - gridSize * blockSize / 2 + blockSize / 2
        );
        block.castShadow = true;
        scene.add(block);
        blocks.push(block);
      }
    }

    // アニメーション
    let angle = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      angle += 0.005;
      const dist = baseDist;
      camera.position.x = dist * Math.cos(angle);
      camera.position.z = dist * Math.sin(angle);
      camera.position.y = dist * 1.2;
      camera.lookAt(0, 2, 0);
      renderer.render(scene, camera);
    };
    animate();

    // クリーンアップ
    return () => {
      renderer.domElement.removeEventListener('wheel', handleWheel);
      mountRef.current?.removeChild(renderer.domElement);
      blocks.forEach(block => {
        block.geometry.dispose();
        block.material.dispose();
      });
      boardGeometry.dispose();
      boardMaterial.dispose();
      renderer.dispose();
    };
  }, [gridSize, patternNumber, basePattern, zoomLevel]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">木製ブロック 規則的パターン 3D可視化</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パターン番号（1-10）
            </label>
            <input
              type="number"
              value={patternNumber}
              onChange={(e) => setPatternNumber(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-lg"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              グリッドサイズ: {gridSize}×{gridSize}
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ズーム: {zoomLevel.toFixed(1)}x
            </label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                className="flex-1 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
              >
                ー
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
              >
                リセット
              </button>
              <button
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))}
                className="flex-1 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
              >
                ＋
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              {showGrid ? '基本パターンを非表示' : '基本パターン(10×10)を表示'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
          <div className="font-semibold text-blue-900">パターン {patternNumber}: {currentParams.name}</div>
          <div className="text-sm text-blue-700 mt-1">
            10×10の基本パターンを{[2, 3, 7, 9].includes(patternNumber) ? '単純タイル配置' : '反転タイル配置'} |
            高さ: 0階層(0mm) ～ 3階層(6mm) の4段階
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>🔄 <strong>反転タイル配置:</strong> 格子・同心円などは奇数タイルで反転（斜め縞は反転なし）</p>
          <p>📐 <strong>4段階の高さ:</strong> 0mm(階層0) → 2mm(階層1) → 4mm(階層2) → 6mm(階層3)</p>
          <p>🔍 <strong>ズーム:</strong> マウスホイールまたはボタンで拡大縮小（0.5x～3x）</p>
          <p>📏 <strong>グリッドサイズ:</strong> 5×5 ～ 30×30まで対応</p>
        </div>
      </div>

      <div className="flex-1 flex">
        <div ref={mountRef} className={showGrid ? "w-2/3" : "w-full"} />

        {showGrid && basePattern.length > 0 && (
          <div className="w-1/3 bg-white p-4 overflow-auto">
            <h3 className="font-bold text-lg mb-2">基本パターン 10×10（mm）</h3>
            <p className="text-xs text-gray-600 mb-3">
              {[2, 3, 7, 9].includes(patternNumber)
                ? '※斜め縞パターンは反転なしで配置されます'
                : '※奇数タイルでは反転して配置されます'}
            </p>
            <div className="text-xs font-mono">
              <table className="border-collapse w-full">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 bg-gray-100 text-xs">列→</th>
                    {basePattern[0]?.map((_, colIdx) => (
                      <th key={colIdx} className="border px-2 py-1 bg-gray-100 text-xs">{colIdx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {basePattern.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="border px-2 py-1 bg-gray-100 font-semibold text-xs">行{rowIdx + 1}</td>
                      {row.map((height, colIdx) => {
                        const colors = ['#8B4513', '#A0522D', '#CD853F', '#DAA520'];
                        const colorIndex = height / 2;
                        return (
                          <td
                            key={colIdx}
                            className="border px-2 py-1 text-center font-semibold"
                            style={{
                              backgroundColor: colors[colorIndex],
                              color: colorIndex >= 2 ? '#000' : '#fff'
                            }}
                          >
                            {height}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border" style={{backgroundColor: '#8B4513'}}></div>
                  <span>0mm（階層0）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border" style={{backgroundColor: '#A0522D'}}></div>
                  <span>2mm（階層1）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border" style={{backgroundColor: '#CD853F'}}></div>
                  <span>4mm（階層2）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border" style={{backgroundColor: '#DAA520'}}></div>
                  <span>6mm（階層3）</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WoodBlockWave3D;
