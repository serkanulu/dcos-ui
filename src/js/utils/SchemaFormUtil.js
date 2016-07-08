import tv4 from 'tv4';

import FormUtil from './FormUtil';
import Util from './Util';

function filteredPaths(combinedPath) {
  return combinedPath.split('/').filter(function (path) {
    return path.length > 0;
  });
}

function getErroredFieldPositions(definition) {
  let fieldsWithError = [];

  definition.forEach(function (fieldDefinition, indexInForm) {
    if (Array.isArray(fieldDefinition)) {
      fieldDefinition.forEach(function (deeper, indexInRow) {
        let hasError = !!deeper.showError;

        if (hasError) {
          fieldsWithError.push({
            indexInForm: indexInForm,
            indexInRow: indexInRow,
            showError: deeper.showError
          });
        }
      });
    }
  });

  return fieldsWithError;
}

function setDefinitionValue(thingToSet, definition, renderRemove, model) {
  let {path, value} = thingToSet;
  let definitionToSet = SchemaFormUtil.getDefinitionFromPath(definition, path);

  if (Array.isArray(value) && value.length !== 0) {
    let prop = path[path.length - 1];

    let firstIndex = 0;
    definitionToSet.definition.find(function (field, i) {
      if (FormUtil.isFieldInstanceOfProp(prop, field)) {
        firstIndex = i;
        return true;
      }

      return false;
    });

    let indexesToError = getErroredFieldPositions(definitionToSet.definition);

    FormUtil.removePropID(definitionToSet.definition, prop);

    value.forEach(function (item, index) {
      let propID = Util.uniqueID(prop);
      let instanceDefinition = FormUtil.getMultipleFieldDefinition(
        prop,
        propID,
        definitionToSet.definition.itemShapes[prop].definition,
        item
      );

      if (definitionToSet.definition.itemShapes[prop].filterProperties) {
        definitionToSet.definition.itemShapes[prop]
          .filterProperties(item, instanceDefinition, model);
      }

      let arrayAction = 'push';
      if (definitionToSet.definition.itemShapes[prop].deleteButtonTop) {
        arrayAction = 'unshift';
      }

      let title = null;
      if (definitionToSet.definition.itemShapes[prop].getTitle) {
        title = definitionToSet.definition.itemShapes[prop].getTitle(index + 1);
        title = definitionToSet.definition.itemShapes[prop].getTitle(index + 1);
      }
      instanceDefinition[arrayAction](
        renderRemove(definitionToSet.definition, prop, propID, title)
      );
      definitionToSet.definition.splice(firstIndex++, 0, instanceDefinition);
    });

    indexesToError.forEach(function (indexToError) {
      let needsToError = definitionToSet.definition[indexToError.indexInForm];
      if (needsToError) {
        needsToError = needsToError[indexToError.indexInRow];
        if (needsToError) {
          needsToError.showError = indexToError.showError;
        }
      }
    });
  }

  definitionToSet.value = value;
  definitionToSet.startValue = value;

  if (definitionToSet.filterProperties) {
    definitionToSet.filterProperties(value, definitionToSet, model);
  }
}

function getThingsToSet(model, path) {
  path = path || [];
  let thingsToSet = [];

  if (Array.isArray(model)) {
    thingsToSet.push({
      path,
      value: model
    });

    return thingsToSet;
  }

  Object.keys(model).forEach(function (key) {
    let pathCopy = path.concat([key]);
    let value = model[key];

    if (typeof value === 'object' && value !== null) {
      thingsToSet = thingsToSet.concat(getThingsToSet(value, pathCopy));
    } else {
      thingsToSet.push({
        path: pathCopy,
        value
      });
    }
  });

  return thingsToSet;
}

function processValue(value, valueType) {
  if (valueType === 'integer' || valueType === 'number') {
    if (value !== null && value !== '') {
      let parsedNumber = Number(value);
      if (isNaN(parsedNumber)) {
        return value;
      }

      return parsedNumber;
    }
  }

  if (valueType === 'boolean' && value == null) {
    return false;
  }

  if (value == null || value === '') {
    return null;
  }

  if (valueType === 'array' && typeof value === 'string') {
    return value.split(',')
      .map(function (val) { return val.trim(); })
      .filter(function (val) { return val !== ''; });
  }

  return value;
}

let SchemaFormUtil = {
  getDefinitionFromPath(definition, paths) {
    if (definition[paths[0]]) {
      definition = definition[paths[0]];
      paths = paths.slice(1);
    }

    paths.forEach(function (path) {
      if (definition.definition == null) {
        return;
      }

      let nextDefinition = Array.prototype
        .concat.apply([], definition.definition).find(
          function (definitionField) {
            return definitionField.name === path
              || definitionField.title === path;
          }
        );

      if (nextDefinition) {
        definition = nextDefinition;
      }
    });

    return definition;
  },

  processFormModel(model, multipleDefinition, prevPath = []) {
    let newModel = {};

    Object.keys(model).forEach(function (key) {
      let value = model[key];
      let path = prevPath.concat([key]);

      // Nested model.
      if (typeof value === 'object' && value !== null) {
        newModel[key] = SchemaFormUtil.processFormModel(
          value, multipleDefinition, path
        );
        return;
      }

      let definition = SchemaFormUtil.getDefinitionFromPath(
        multipleDefinition, path
      );
      if (definition == null) {
        return;
      }

      let {isRequired, valueType} = definition;
      let processedValue = processValue(value, valueType);
      if (processedValue != null || isRequired) {
        newModel[key] = processedValue;
      }
    });

    return FormUtil.modelToCombinedProps(newModel);
  },

  mergeModelIntoDefinition(model, definition, renderRemove) {
    let thingsToSet = getThingsToSet(model);

    thingsToSet.forEach(function (thingToSet) {
      setDefinitionValue(
        thingToSet, definition, renderRemove, model
      );
    });
  },

  parseTV4Error(tv4Error) {
    let errorObj = {
      message: tv4Error.message,
      path: filteredPaths(tv4Error.dataPath)
    };

    let schemaPath = tv4Error.schemaPath.split('/');

    if (tv4Error.code === 302) {
      errorObj.path.push(tv4Error.params.key);
    }

    if (schemaPath[schemaPath.length - 2] === 'items') {
      errorObj.path.pop();
    }

    return errorObj;
  },

  validateModelWithSchema(model, schema) {
    let result = tv4.validateMultiple(model, schema);

    if (result == null || result.valid) {
      return [];
    }

    return result.errors.map(function (error) {
      return SchemaFormUtil.parseTV4Error(error);
    });
  }
};

module.exports = SchemaFormUtil;
