set JAVA_OPTS=-Xms512m -Xmx2048m -XX:+DisableExplicitGC --add-opens=java.xml/com.sun.org.apache.xerces.internal.parsers=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.management/com.sun.jmx.mbeanserver=ALL-UNNAMED --add-opens=jdk.internal.jvmstat/sun.jvmstat.monitor=ALL-UNNAMED --add-opens=java.base/sun.reflect.generics.reflectiveObjects=ALL-UNNAMED --add-opens=jdk.management/com.sun.management.internal=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED

set CATALINA_OPTS="-Dcadenza.workDir=%CADENZA_INSTALL_DIR%/cadenza/WEB-INF/" ^
 "-Djava.awt.headless=true" ^
 "-Dhibernate.jdbc.fetch_size=100" ^
 "-Dnet.disy.cadenza.web.docbasepath=%CADENZA_INSTALL_DIR%/cadenza/" ^
 "-DCADENZA_CONFIG_PATH=%CADENZA_INSTALL_DIR_SLASHES%/config/" ^
 "-DCADENZA_THEMES_PATH=%CADENZA_INSTALL_DIR%/config/themes" ^
 "-DCADENZA_CUSTOM_PROPERTIES=%CADENZA_INSTALL_DIR%/config/messages/messages" ^
 "-DDEMO_DATA_PATH=file:///%CADENZA_INSTALL_DIR_SLASHES%/data/demo-data/" ^
 "-DHOSTNAME=localhost" ^
 "-DINSTALL_PATH=%CADENZA_INSTALL_DIR%" ^
 "-DDIRECTORY_DATABASE=%CADENZA_INSTALL_DIR%/data" ^
 "-Djava.util.prefs.PreferencesFactory=net.disy.cadenza.web.preferences.NoopPreferencesFactory" ^
 "-Duser.language=%CADENZA_LANGUAGE%" ^
 "-Duser.country=%CADENZA_COUNTRY%" ^
 "-DCADENZA_EXIT_ON_STARTUP_ERROR=true" ^
 "-Dnet.disy.cadenza.web.serverport=%CADENZA_SERVER_PORT%" ^
 "-DCADENZA_CHROMEDRIVER_EXECUTABLE=%CADENZA_INSTALL_DIR%/tools/chrome-driver/chromedriver.exe" ^
 "-DCADENZA_CHROME_EXECUTABLE=%CADENZA_INSTALL_DIR%/tools/chrome-driver/chromium_win/chrome.exe" ^
 "-DH2_HOST=file:%CADENZA_INSTALL_DIR%/data" ^
 "-DAUTHORIZATION_DB_DRIVER=org.h2.Driver" ^
 "-DAUTHORIZATION_DB_URL=jdbc:h2:file:%CADENZA_INSTALL_DIR%/data/authorization/authorization" ^
 "-DAUTHORIZATION_DB_USER=userauthorization" ^
 "-DAUTHORIZATION_DB_PW=daad99f88df991fe8ce59ffe8ae38ce2" ^
 "-DREPO_DB_URL=jdbc:h2:file:%CADENZA_INSTALL_DIR%/data/repository/repository" ^
 "-DREPO_DB_DRIVER=org.h2.Driver" ^
 "-DREPO_DB_USER=userrepository" ^
 "-DREPO_DB_PW=daad99eb8efe91e28bff90e29b" ^
 "-DAUDITLOG_DB_DRIVER=org.h2.Driver" ^
 "-DAUDITLOG_DB_URL=jdbc:h2:file:%CADENZA_INSTALL_DIR%/data/auditLog/auditLog" ^
 "-DAUDITLOG_DB_USER=userauditlog" ^
 "-DAUDITLOG_DB_PW=daad99f88de980f498f790" ^
 "-DUSERPREF_DB_DRIVER=org.h2.Driver" ^
 "-DUSERPREF_DB_URL=jdbc:h2:file:%CADENZA_INSTALL_DIR%/data/userprefs/userprefs" ^
 "-DUSERPREF_DB_USER=userprefs" ^
 "-DUSERPREF_DB_PW=daadc9fd88fb9eec9cee8bed9e" ^
 "-DCONFIG_DB_DRIVER=org.h2.Driver" ^
 "-DCONFIG_DB_URL=jdbc:h2:file:%CADENZA_INSTALL_DIR%/data/configuration/configuration" ^
 "-DCONFIG_DB_USER=userconfigdb" ^
 "-DCONFIG_DB_PW=daad99fa95fb9df493f795" ^
 "-DJOB_DB_DRIVER=org.h2.Driver" ^
 "-DJOB_DB_URL=jdbc:h2:file:%CADENZA_INSTALL_DIR%/data/job_scheduling/job_scheduling" ^
 "-DJOB_DB_USER=userjobscheduling" ^
 "-DJOB_DB_PW=daad99f39cfe8dee86e387f29ef799fe" ^
 "-DGEOCODER_URL=https://geocoding.gdi.disy.net/" ^
 "-DROUTING_URL=https://routing.gdi.disy.net/ors/" ^
 "-DEMBEDDED_ADMIN_PW=Administrator" ^
 "-DEMBEDDED_VIEWER_PW=SecretViewer" ^
 "-DCDS_DB_DRIVER=org.h2.Driver" ^
 "-DCDS_DB_URL=jdbc:h2:file:%CADENZA_INSTALL_DIR%/data/datastore/datastore" ^
 "-DCDS_DB_USER=userdatastore" ^
 "-DCDS_DB_PW=pw4datastore" ^
 "-DMAP_WMS_URL=https://maps.gdi.disy.net/mapproxy/service" ^
 "-DMAP_VECTOR_TILES_URL=https://vectortiles.gdi.disy.net/styles/osm-bright/style.json" ^
 "-Dnet.disy.database.migrate=true" ^
 "-Dnet.disy.cadenza.api.unpublished=true" ^
 "-Dnet.disy.cadenza.sandbox=true"

rem Include this into the CATALINA_OPTS definition to enable reloading the webrepository
rem Please be adviced that we initially deliver default user and password files for JMX
rem We strongly recommend that you change them to fit your needs.
rem Please be also adviced that both files needs special file settings.
rem Set file permissions so that only the owner can read and write the password file.
rem "-Dcom.sun.management.jmxremote.port=8004" "-Dcom.sun.management.jmxremote.ssl=true" "-Dcom.sun.management.jmxremote.authenticate=true" "-Dcom.sun.management.jmxremote.password.file=/opt/disy/cadenza5.1.54/CadenzaWeb/conf/jmxremote.password" "-Dcom.sun.management.jmxremote.access.file=/opt/disy/cadenza5.1.54/CadenzaWeb/conf/jmxremote.access"

rem Extend CLASSPATH to allow Tomcat logging via Log4J
set CLASSPATH=%CATALINA_HOME%/log4j/lib/*;%CATALINA_HOME%/log4j/conf