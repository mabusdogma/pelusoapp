async function checkForUpdates() {
    try {
        // 1. Obtener la referencia al plugin App de forma segura
        const App = window.Capacitor?.Plugins?.App;
        if (!App) return; // Si no está en entorno nativo Capacitor, salir

        const appInfo = await App.getInfo();
        const currentVersionCode = appInfo.build ? parseInt(appInfo.build, 10) : 1;

        // 2. URL de tu Home Assistant
        const HA_URL = "http://192.168.1.132:8123/local";

        // 3. Consultar el archivo version.json
        const response = await fetch(`${HA_URL}/version.json?t=${Date.now()}`);
        if (!response.ok) return;
        
        const remoteData = await response.json();

        // 4. Comparar versiones y mostrar aviso si hay una nueva
        if (remoteData.versionCode > currentVersionCode) {
            showUpdateModal(remoteData.versionName, `${HA_URL}/pelusoapp.apk`);
        }
    } catch (error) {
        console.log("No se pudo comprobar la actualización:", error);
    }
}

function showUpdateModal(versionName, apkUrl) {
    if (document.getElementById('update-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'update-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); display: flex; align-items: center;
        justify-content: center; z-index: 10000; font-family: sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #222; color: #fff; padding: 25px; border-radius: 12px; width: 85%; max-width: 350px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <h3 style="margin-top: 0; color: #ff9800;">¡Nueva actualización!</h3>
            <p style="color: #ccc; font-size: 14px;">Hay una nueva versión (${versionName}) disponible en tu sistema.</p>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="btn-cancel-update" style="flex: 1; padding: 10px; background: #444; border: none; color: #fff; border-radius: 6px; font-weight: bold; cursor: pointer;">Cancelar</button>
                <button id="btn-accept-update" style="flex: 1; padding: 10px; background: #4CAF50; border: none; color: #fff; border-radius: 6px; font-weight: bold; cursor: pointer;">Actualizar</button>
            </div>
            <div id="update-progress" style="margin-top: 15px; font-size: 12px; color: #888; display: none;">Descargando actualización...</div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btn-cancel-update').onclick = () => modal.remove();

    document.getElementById('btn-accept-update').onclick = async () => {
        const progressEl = document.getElementById('update-progress');
        progressEl.style.display = 'block';
        document.getElementById('btn-accept-update').disabled = true;
        document.getElementById('btn-cancel-update').disabled = true;

        try {
            progressEl.innerText = "Descargando APK...";
            
            const Filesystem = window.Capacitor?.Plugins?.Filesystem;
            const FileOpener = window.Capacitor?.Plugins?.FileOpener;

            if (!Filesystem || !FileOpener) {
                throw new Error("Plugins nativos no encontrados");
            }

            const downloadResult = await Filesystem.downloadFile({
                url: apkUrl,
                path: 'pelusoapp.apk',
                directory: 'CACHE'
            });

            progressEl.innerText = "Abriendo instalador...";

            await FileOpener.open({
                filePath: downloadResult.path,
                contentType: 'application/vnd.android.package-archive'
            });

            modal.remove();
        } catch (e) {
            console.error("Error al actualizar:", e);
            progressEl.innerText = "Error al actualizar. Inténtalo de nuevo.";
            document.getElementById('btn-accept-update').disabled = false;
            document.getElementById('btn-cancel-update').disabled = false;
        }
    };
}

// Inicializar la comprobación automática a los 3 segundos de arrancar la app
window.addEventListener('load', () => {
    setTimeout(checkForUpdates, 3000);
});
