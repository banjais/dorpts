$content = Get-Content 'src/App.tsx' -Raw

$old = @'
  const handleManualSync = async () => {
    setIsSyncing(true);
    let isOfflineFallback = !isOnline;
    try {
      // 1. Force fetch metadata or fallback to cached snapshot
      let metadataSnap;
      if (isOfflineFallback) {
        metadataSnap = await getDoc(doc(db, "metadata", "current"));
      } else {
        try {
          metadataSnap = await getDocFromServer(doc(db, "metadata", "current"));
        } catch (_) {
          console.warn("getDocFromServer failed, falling back to cached getDoc:");
          isOfflineFallback = true;
          metadataSnap = await getDoc(doc(db, "metadata", "current"));
        }
      }

      if (metadataSnap.exists()) {
        const data = metadataSnap.data() as SystemMetadata;
        setMetadata(data);
        if (data.lastUpdateDate) {
          localStorage.setItem("dor_last_seen_update", data.lastUpdateDate);
        }
        markVersionUpdated();
        try {
          localStorage.setItem("dor_metadata_cache", JSON.stringify(data));
        } catch (_) {
          // Suppress redundant log
        }
      }

      // 2. Force fetch indicators or fallback to cached snapshot
      const q = query(collection(db, "indicators"), orderBy("id"));
      let indicatorsSnap;
      if (isOfflineFallback) {
        indicatorsSnap = await getDocs(q);
      } else {
        try {
          indicatorsSnap = await getDocsFromServer(q);
        } catch (_) {
          console.warn("getDocsFromServer failed, falling back to cached getDocs:");
          isOfflineFallback = true;
          indicatorsSnap = await getDocs(q);
        }
      }

      if (!indicatorsSnap.empty) {
        const list: Indicator[] = [];
        indicatorsSnap.forEach((d) => {
          list.push(d.data() as Indicator);
        });
        setIndicators(list);
        try {
          localStorage.setItem("dor_indicators_cache", JSON.stringify(list));
        } catch (_) {
          // Suppress redundant log
        }
      }

      // 3. Force fetch history or fallback to cached snapshot
      const qHistory = query(
        collection(db, "updates_history"),
        orderBy("id", "desc"),
      );
      let historySnap;
      if (isOfflineFallback) {
        historySnap = await getDocs(qHistory);
      } else {
        try {
          historySnap = await getDocsFromServer(qHistory);
        } catch (_) {
          console.warn("getDocsFromServer for history failed, falling back to cached getDocs:");
          isOfflineFallback = true;
          historySnap = await getDocs(qHistory);
        }
      }

      const history: any[] = [];
      historySnap.forEach((d) => history.push(d.data()));
      setUpdatesHistory(history);

      // Always refresh from published Sheets so Sync reflects Sheet edits too
      try {
        const published = await syncPublishedSheets({
          dashboard: appSettings.dashboardPublishedUrl,
          offices: appSettings.officesPublishedUrl,
        });
        if (published.indicators.length > 0) {
          setIndicators(published.indicators);
          setMetadata(published.metadata);
          try {
            localStorage.setItem("dor_indicators_cache", JSON.stringify(published.indicators));
            localStorage.setItem("dor_metadata_cache", JSON.stringify(published.metadata));
          } catch (_) {}
        }
        if (published.offices.length > 0) {
          setOffices(published.offices);
          setOfficesList(published.offices);
          try {
            localStorage.setItem("dor_offices_cache", JSON.stringify(published.offices));
          } catch (_) {}
        }
        const newSheetUpdates = published.indicators
          .filter((i: any) => i.updatedAt)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 20)
          .map((ind: any, idx: number) => ({
            id: `sheet_${ind.id || idx}_${Date.now()}`,
            lastUpdateDate: ind.updatedAt,
            metadata: { updatedBy: ind.updatedBy },
            indicators: [ind],
            isSheetEntry: true,
          }));
        setSheetUpdates(newSheetUpdates);
        setHealthRetryKey((prev) => prev + 1);
      } catch (publishedErr) {
        console.error("Published Sheets sync failed:", publishedErr);
      }

      try {
        localStorage.setItem(
          "dor_last_sync_timestamp",
          new Date().toISOString(),
        );
      } catch (_) {
        // Suppress redundant log
      }

      if (isOfflineFallback) {
        addToast(
          language === "en"
            ? "Sync Complete (Offline Mode)"
            : "सिङ्क सम्पन्न (अफलाइन मोड)",
          language === "en"
            ? "Using cached local database snapshot. Data will fully synchronize when online."
            : "सुरक्षित स्थानीय डाटा देखाइएको छ। अनलाइन भएपछि पूर्ण सिंक्रोनाइज हुनेछ।",
          "warning",
        );
      } else {
        addToast(
          language === "en"
            ? "Data successfully re-synchronized with server"
            : "डाटा सर्भरसँग सफलतापूर्वक पुन: सिंक्रोनाइज गरियो",
          language === "en"
            ? "Data successfully re-synchronized with server"
            : "डाटा सर्भरसँग सफलतापूर्वक पुन: सिंक्रोनाइज गरियो",
          "success",
        );
      }
      setPulseKey((prev) => prev + 1);
    } catch (error) {
      console.error("Manual re-sync failed:", error);
      addToast(
        language === "en"
          ? "Sync failed. Please check your internet connection."
          : "सिङ्क असफल भयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।",
        language === "en"
          ? "Sync failed. Please check your internet connection."
          : "सिङ्क असफल भयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।",
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };
'@

$new = @'
  const handleManualSync = async () => {
    setIsSyncing(true);
    let isOfflineFallback = !isOnline;
    try {
      let metadataSnap: any = null;
      let indicatorsSnap: any = null;
      let historySnap: any = null;

      if (!isOfflineFallback) {
        try {
          const metaPromise = getDocFromServer(doc(db, "metadata", "current")).catch(() => null);
          const indPromise = getDocsFromServer(query(collection(db, "indicators"), orderBy("id"))).catch(() => null);
          const historyPromise = getDocsFromServer(query(collection(db, "updates_history"), orderBy("id", "desc"))).catch(() => null);

          const [metaResult, indResult, historyResult] = await Promise.all([metaPromise, indPromise, historyPromise]);

          if (metaResult) metadataSnap = metaResult;
          if (indResult) indicatorsSnap = indResult;
          if (historyResult) historySnap = historyResult;

          if (!metaResult || !indResult || !historyResult) {
            console.warn("Some parallel server fetches failed, falling back to cached getDocs:");
            isOfflineFallback = true;
          }
        } catch (_) {
          console.warn("Parallel server fetch failed, falling back to cached getDocs:");
          isOfflineFallback = true;
        }
      }

      if (isOfflineFallback) {
        metadataSnap = await getDoc(doc(db, "metadata", "current"));
        indicatorsSnap = await getDocs(query(collection(db, "indicators"), orderBy("id")));
        historySnap = await getDocs(query(collection(db, "updates_history"), orderBy("id", "desc")));
      }

      if (metadataSnap?.exists()) {
        const data = metadataSnap.data() as SystemMetadata;
        setMetadata(data);
        if (data.lastUpdateDate) {
          localStorage.setItem("dor_last_seen_update", data.lastUpdateDate);
        }
        markVersionUpdated();
        try {
          localStorage.setItem("dor_metadata_cache", JSON.stringify(data));
        } catch (_) {}
      }

      if (!indicatorsSnap?.empty) {
        const list: Indicator[] = [];
        indicatorsSnap.forEach((d: any) => {
          list.push(d.data() as Indicator);
        });
        setIndicators(list);
        try {
          localStorage.setItem("dor_indicators_cache", JSON.stringify(list));
        } catch (_) {}
      }

      if (!historySnap?.empty) {
        const history: any[] = [];
        historySnap.forEach((d: any) => {
          history.push(d.data());
        });
        setUpdatesHistory(history);
      }

      try {
        const published = await syncPublishedSheets({
          dashboard: appSettings.dashboardPublishedUrl,
          offices: appSettings.officesPublishedUrl,
        });
        if (published.indicators.length > 0) {
          setIndicators(published.indicators);
          setMetadata(published.metadata);
          try {
            localStorage.setItem("dor_indicators_cache", JSON.stringify(published.indicators));
            localStorage.setItem("dor_metadata_cache", JSON.stringify(published.metadata));
          } catch (_) {}
        }
        if (published.offices.length > 0) {
          setOffices(published.offices);
          setOfficesList(published.offices);
          try {
            localStorage.setItem("dor_offices_cache", JSON.stringify(published.offices));
          } catch (_) {}
        }
        const newSheetUpdates = published.indicators
          .filter((i: any) => i.updatedAt)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 20)
          .map((ind: any, idx: number) => ({
            id: `sheet_${ind.id || idx}_${Date.now()}`,
            lastUpdateDate: ind.updatedAt,
            metadata: { updatedBy: ind.updatedBy },
            indicators: [ind],
            isSheetEntry: true,
          }));
        setSheetUpdates(newSheetUpdates);
        setHealthRetryKey((prev) => prev + 1);
      } catch (publishedErr) {
        console.error("Published Sheets sync failed:", publishedErr);
      }

      try {
        localStorage.setItem(
          "dor_last_sync_timestamp",
          new Date().toISOString(),
        );
      } catch (_) {}

      if (isOfflineFallback) {
        addToast(
          language === "en"
            ? "Sync Complete (Offline Mode)"
            : "सिङ्क सम्पन्न (अफलाइन मोड)",
          language === "en"
            ? "Using cached local database snapshot. Data will fully synchronize when online."
            : "सुरक्षित स्थानीय डाटा देखाइएको छ। अनलाइन भएपछि पूर्ण सिंक्रोनाइज हुनेछ।",
          "warning",
        );
      } else {
        addToast(
          language === "en"
            ? "Data successfully re-synchronized with server"
            : "डाटा सर्भरसँग सफलतापूर्वक पुन: सिंक्रोनाइज गरियो",
          language === "en"
            ? "Data successfully re-synchronized with server"
            : "डाटा सर्भरसँग सफलतापूर्वक पुन: सिंक्रोनाइज गरियो",
          "success",
        );
      }
      setPulseKey((prev) => prev + 1);
    } catch (error) {
      console.error("Manual re-sync failed:", error);
      addToast(
        language === "en"
          ? "Sync failed. Please check your internet connection."
          : "सिङ्क असफल भयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।",
        language === "en"
          ? "Sync failed. Please check your internet connection."
          : "सिङ्क असफल भयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।",
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };
'@

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    Set-Content 'src/App.tsx' $content
    Write-Output "Replaced handleManualSync successfully"
} else {
    Write-Output "ERROR: Could not find exact match for handleManualSync"
}
